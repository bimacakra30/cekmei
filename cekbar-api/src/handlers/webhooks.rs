use std::sync::Arc;
use axum::{
    body::Bytes,
    extract::State,
    http::HeaderMap,
    routing::post,
    Json, Router,
};
use serde_json::json;

use crate::error::{AppError, AppResult};
use crate::utils::crypto::verify_hmac_sha256;
use crate::AppState;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/gopay", post(gopay))
        .route("/ceir", post(ceir))
}

// ── GoPay Webhook ──────────────────────────────────────────────────────

async fn gopay(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    body: Bytes,
) -> AppResult<Json<serde_json::Value>> {
    let payload = String::from_utf8_lossy(&body);
    let data: serde_json::Value = serde_json::from_str(&payload)
        .map_err(|_| AppError::BadRequest("Invalid JSON".into()))?;

    let event = data.get("event").and_then(|v| v.as_str()).unwrap_or("");
    let trx_id = data.get("trx_id").and_then(|v| v.as_str()).unwrap_or("");
    let amount = data.get("amount");

    if event.is_empty() || trx_id.is_empty() || amount.is_none() {
        return Err(AppError::BadRequest("Missing required fields".into()));
    }

    // Verify HMAC signature
    let signature = headers.get("x-webhook-signature")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    if !verify_hmac_sha256(state.config.gopay_api_key.as_bytes(), &body, signature) {
        tracing::error!("GoPay webhook: invalid signature for trx_id={}", trx_id);
        return Err(AppError::Unauthorized);
    }

    // Find payment
    let payment: Option<(String, String, String, String)> = sqlx::query_as(
        "SELECT payment_id, order_id, CAST(total_amount AS CHAR) as total_amount, status FROM payments WHERE trx_id = ? LIMIT 1"
    )
    .bind(trx_id)
    .fetch_optional(&state.db)
    .await?;

    let (payment_id, order_id, _total, status) = match payment {
        Some(p) => p,
        None => {
            tracing::error!("GoPay webhook: payment not found for trx_id={}", trx_id);
            return Ok(Json(json!({ "status": "error", "message": "Payment not found" })));
        }
    };

    if event != "payment.success" {
        return Ok(Json(json!({ "received": true })));
    }

    // Idempotent: only update if MENUNGGU
    if status != "MENUNGGU" {
        return Ok(Json(json!({ "received": true, "message": "Already processed" })));
    }

    let transaction = data.get("transaction");
    let confirmed_at = transaction
        .and_then(|t| t.get("transaction_time"))
        .and_then(|v| v.as_str())
        .and_then(|s| chrono::NaiveDateTime::parse_from_str(s, "%Y-%m-%dT%H:%M:%S%.fZ").ok())
        .unwrap_or_else(|| chrono::Utc::now().naive_utc());

    let gopay_txn_id = transaction.and_then(|t| t.get("transaction_id")).and_then(|v| v.as_str());
    let payer_issuer = transaction.and_then(|t| t.get("payer_issuer")).and_then(|v| v.as_str());
    let payment_type = transaction.and_then(|t| t.get("payment_type")).and_then(|v| v.as_str()).unwrap_or("QRIS");

    let update_result = sqlx::query(
        "UPDATE payments SET status = 'LUNAS', confirmed_at = ?, gopay_transaction_id = ?, payer_issuer = ?, payment_type = ? WHERE payment_id = ? AND status = 'MENUNGGU'"
    )
    .bind(confirmed_at)
    .bind(gopay_txn_id)
    .bind(payer_issuer)
    .bind(payment_type)
    .bind(&payment_id)
    .execute(&state.db)
    .await?;

    if update_result.rows_affected() == 0 {
        return Ok(Json(json!({ "received": true, "message": "Already processed" })));
    }

    tracing::info!("GoPay webhook: payment {} LUNAS via QRIS", payment_id);

    sqlx::query("UPDATE orders SET status = 'PENDING' WHERE order_id = ? AND status = 'PENDING_PAYMENT'")
        .bind(&order_id)
        .execute(&state.db)
        .await?;

    // Process order
    if let Err(e) = crate::services::order_processor::process_order_after_payment(&state, &order_id).await {
        tracing::error!("GoPay webhook: process order {} failed: {}", order_id, e);
        let msg = format!("Gagal proses otomatis: {}", e);
        let _ = sqlx::query("UPDATE orders SET status = 'FAILED', status_note = ? WHERE order_id = ?")
            .bind(&msg[..msg.len().min(255)])
            .bind(&order_id)
            .execute(&state.db)
            .await;
    }

    Ok(Json(json!({ "received": true })))
}

// ── CEIR Webhook ───────────────────────────────────────────────────────

async fn ceir(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    body: Bytes,
) -> AppResult<Json<serde_json::Value>> {
    let payload = String::from_utf8_lossy(&body);

    // Verify HMAC
    let signature = headers.get("x-ceirid-hmac-signature")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    if !verify_hmac_sha256(state.config.ceirid_webhook_secret.as_bytes(), &body, signature) {
        tracing::error!("CEIR webhook: invalid HMAC signature");
        return Err(AppError::Unauthorized);
    }

    let data: serde_json::Value = serde_json::from_str(&payload)
        .map_err(|_| AppError::BadRequest("Invalid JSON".into()))?;

    let event = data.get("event").and_then(|v| v.as_str()).unwrap_or("");
    let webhook_data = data.get("data");

    tracing::info!("CEIR webhook: event={}", event);

    if event != "roamer_order_status_changed" {
        return Ok(Json(json!({ "ok": true })));
    }

    let d = match webhook_data {
        Some(d) => d,
        None => return Err(AppError::BadRequest("Missing data".into())),
    };

    let order_id_val = d.get("order_id");
    let status_val = d.get("status").and_then(|v| v.as_str()).unwrap_or("");

    if order_id_val.is_none() || status_val.is_empty() {
        return Err(AppError::BadRequest("Missing order_id or status".into()));
    }

    // Test webhook
    let order_id_str = order_id_val.map(|v| v.to_string().trim_matches('"').to_string()).unwrap_or_default();
    if order_id_str == "0" {
        return Ok(Json(json!({ "ok": true, "message": "Test acknowledged" })));
    }

    let status_map = |s: &str| -> &str {
        match s {
            "pending" => "PENDING",
            "processing" => "PROCESSING",
            "success" => "SUCCESS",
            "failed" => "FAILED",
            _ => "PROCESSING",
        }
    };

    fn note_for_status(s: &str) -> &'static str {
        match s {
            "pending" => "Menunggu proses...",
            "processing" => "Pesanan sedang diproses...",
            "success" => "Add Roamer berhasil",
            "failed" => "Add Roamer gagal. Hubungi admin untuk pemeriksaan refund.",
            _ => "Processing...",
        }
    }

    let db_status = status_map(status_val);
    let admin_note = d.get("admin_note").and_then(|v| v.as_str()).unwrap_or("");
    let status_note = if !admin_note.is_empty() {
        admin_note.to_string()
    } else {
        note_for_status(status_val).to_string()
    };

    // Find order by ceir_order_id
    let existing: Option<(String, String)> = sqlx::query_as(
        "SELECT order_id, status FROM orders WHERE ceir_order_id = ? OR ceir_order_id LIKE ? LIMIT 1"
    )
    .bind(&order_id_str)
    .bind(format!("%-{}", order_id_str))
    .fetch_optional(&state.db)
    .await?;

    let (local_order_id, current_status) = match existing {
        Some(e) => e,
        None => {
            tracing::warn!("CEIR webhook: order not found for ceir_order_id={}", order_id_str);
            return Ok(Json(json!({ "ok": true, "message": "Order not found but acknowledged" })));
        }
    };

    // Skip if already final
    if current_status == "SUCCESS" || current_status == "FAILED" {
        return Ok(Json(json!({ "ok": true, "message": "Already processed" })));
    }

    // Build result data
    let result_data = d.get("result").map(|r| {
        json!({
            "ceir_order_id": order_id_str,
            "service_id": d.get("service_id"),
            "imei": d.get("imei"),
            "result": r,
            "charged_amount": d.get("charged_amount"),
            "refunded_amount": d.get("refunded_amount"),
        })
    });

    let completed = if status_val == "success" { "NOW()" } else { "NULL" };

    if let Some(ref results) = result_data {
        sqlx::query(&format!(
            "UPDATE orders SET status = ?, status_note = ?, results = ?, completed_at = {} WHERE order_id = ?",
            completed
        ))
        .bind(db_status)
        .bind(&status_note)
        .bind(serde_json::to_string(results).unwrap_or_default())
        .bind(&local_order_id)
        .execute(&state.db)
        .await?;
    } else {
        sqlx::query(&format!(
            "UPDATE orders SET status = ?, status_note = ?, completed_at = {} WHERE order_id = ?",
            completed
        ))
        .bind(db_status)
        .bind(&status_note)
        .bind(&local_order_id)
        .execute(&state.db)
        .await?;
    }

    tracing::info!("CEIR webhook: order {} updated to {} — {}", local_order_id, db_status, status_note);

    Ok(Json(json!({ "ok": true })))
}
