use std::sync::Arc;
use axum::{
    extract::{Path, State},
    response::{sse::Event, Sse},
    routing::{get, post},
    Extension, Json, Router,
};
use chrono::Utc;
use futures_util::stream::Stream;
use serde_json::json;
use std::convert::Infallible;

use crate::error::{AppError, AppResult};
use crate::middleware::auth::CurrentUser;
use crate::AppState;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/{payment_id}", get(get_payment))
        .route("/{payment_id}/sse", get(sse_proxy))
        .route("/{payment_id}/sync", post(sync_payment))
}

// ── Get Payment ────────────────────────────────────────────────────────

async fn get_payment(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<CurrentUser>,
    Path(payment_id): Path<String>,
) -> AppResult<Json<serde_json::Value>> {
    let row: Option<PaymentDetailRow> = sqlx::query_as(
        r#"SELECT p.payment_id, p.order_id, CAST(p.amount AS CHAR) as amount, CAST(p.fee AS CHAR) as fee, CAST(p.total_amount AS CHAR) as total_amount,
                  p.qris_id, p.trx_id, p.qr_image, p.qris_url,
                  p.gopay_transaction_id, p.payer_issuer, p.payment_type,
                  p.status, p.confirmed_at, p.expires_at, p.created_at,
                  o.service_name, o.user_id
           FROM payments p
           JOIN orders o ON o.order_id = p.order_id
           WHERE p.payment_id = ?"#,
    )
    .bind(&payment_id)
    .fetch_optional(&state.db)
    .await?;

    let p = row.ok_or_else(|| AppError::NotFound("Payment tidak ditemukan".into()))?;

    if p.user_id != user.id
        && user.role != crate::models::user::UserRole::Admin
        && user.role != crate::models::user::UserRole::Superadmin
    {
        return Err(AppError::Forbidden);
    }

    // Auto-expire check
    let mut status = p.status.clone();
    if status == "MENUNGGU" {
        if let Some(ref expires) = p.expires_at {
            if Utc::now().naive_utc() > *expires {
                sqlx::query("UPDATE payments SET status = 'KADALUARSA' WHERE payment_id = ? AND status = 'MENUNGGU'")
                    .bind(&payment_id)
                    .execute(&state.db)
                    .await?;
                sqlx::query("UPDATE orders SET status = 'EXPIRED' WHERE order_id = ? AND status = 'PENDING_PAYMENT'")
                    .bind(&p.order_id)
                    .execute(&state.db)
                    .await?;
                status = "KADALUARSA".into();
            }
        }
    }

    Ok(Json(json!({
        "paymentId": p.payment_id,
        "orderId": p.order_id,
        "serviceName": p.service_name,
        "amount": p.amount,
        "fee": p.fee,
        "totalAmount": p.total_amount,
        "status": status,
        "createdAt": p.created_at.and_utc().to_rfc3339(),
        "expiresAt": p.expires_at.map(|dt| dt.and_utc().to_rfc3339()),
        "confirmedAt": p.confirmed_at.map(|dt| dt.and_utc().to_rfc3339()),
        "qrisId": p.qris_id.as_deref().unwrap_or(""),
        "trxId": p.trx_id.as_deref().unwrap_or(""),
        "qrImage": p.qr_image.as_deref().unwrap_or(""),
        "qrisUrl": p.qris_url.as_deref().unwrap_or(""),
        "gopayTransactionId": p.gopay_transaction_id.as_deref().unwrap_or(""),
        "payerIssuer": p.payer_issuer.as_deref().unwrap_or(""),
        "paymentType": p.payment_type.as_deref().unwrap_or(""),
        "gopayApiUrl": state.config.gopay_api_url,
    })))
}

// ── SSE Proxy ──────────────────────────────────────────────────────────

async fn sse_proxy(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<CurrentUser>,
    Path(payment_id): Path<String>,
) -> AppResult<Sse<impl Stream<Item = Result<Event, Infallible>>>> {
    let row: Option<(Option<String>, String, i32)> = sqlx::query_as(
        r#"SELECT p.qris_id, p.status, o.user_id
           FROM payments p
           JOIN orders o ON o.order_id = p.order_id
           WHERE p.payment_id = ?"#,
    )
    .bind(&payment_id)
    .fetch_optional(&state.db)
    .await?;

    let (qris_id, status, owner_id) = row.ok_or_else(|| AppError::NotFound("Not found".into()))?;

    if owner_id != user.id
        && user.role != crate::models::user::UserRole::Admin
        && user.role != crate::models::user::UserRole::Superadmin
    {
        return Err(AppError::Forbidden);
    }

    let qris_id = match qris_id {
        Some(id) if status == "MENUNGGU" => id,
        _ => return Err(AppError::BadRequest("No active QRIS".into())),
    };

    let upstream_url = format!("{}/api/qr-events/{}", state.config.gopay_api_url, qris_id);

    let stream = async_stream::stream! {
        match reqwest::Client::new()
            .get(&upstream_url)
            .header("Accept", "text/event-stream")
            .send()
            .await
        {
            Ok(resp) => {
                use futures_util::StreamExt;
                let mut byte_stream = resp.bytes_stream();
                while let Some(chunk) = byte_stream.next().await {
                    match chunk {
                        Ok(bytes) => {
                            let text = String::from_utf8_lossy(&bytes);
                            yield Ok::<_, Infallible>(Event::default().data(text.to_string()));

                            if text.contains("\"PAID\"") && text.contains("\"paid\":true") {
                                break;
                            }
                        }
                        Err(_) => break,
                    }
                }
            }
            Err(e) => {
                tracing::error!("SSE proxy error: {e}");
                yield Ok::<_, Infallible>(Event::default().data(
                    json!({"status": "ERROR", "paid": false}).to_string()
                ));
            }
        }
    };

    Ok(Sse::new(stream))
}

// ── Sync Payment ───────────────────────────────────────────────────────

async fn sync_payment(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<CurrentUser>,
    Path(payment_id): Path<String>,
) -> AppResult<Json<serde_json::Value>> {
    let row: Option<PaymentSyncRow> = sqlx::query_as(
        r#"SELECT p.payment_id, p.order_id, p.qris_id, p.status,
                  o.user_id, o.order_id AS o_order_id
           FROM payments p
           JOIN orders o ON o.order_id = p.order_id
           WHERE p.payment_id = ?"#,
    )
    .bind(&payment_id)
    .fetch_optional(&state.db)
    .await?;

    let p = row.ok_or_else(|| AppError::NotFound("Payment tidak ditemukan".into()))?;

    if p.user_id != user.id
        && user.role != crate::models::user::UserRole::Admin
        && user.role != crate::models::user::UserRole::Superadmin
    {
        return Err(AppError::Forbidden);
    }

    if p.status != "MENUNGGU" {
        return Ok(Json(json!({ "status": p.status, "synced": false, "message": "Status sudah final" })));
    }

    let qris_id = match &p.qris_id {
        Some(id) if !id.is_empty() => id.clone(),
        _ => return Ok(Json(json!({ "status": p.status, "synced": false, "message": "Data QRIS belum tersedia" }))),
    };

    // Check QR status from GoPay
    match state.gopay.check_qr_status(&qris_id).await {
        Ok(qr_result) => {
            let qr_status = qr_result.get("status").and_then(|v| v.as_str()).unwrap_or("");
            let paid = qr_result.get("paid").and_then(|v| v.as_bool()).unwrap_or(false);

            if qr_status == "EXPIRED" {
                sqlx::query("UPDATE payments SET status = 'KADALUARSA' WHERE payment_id = ? AND status = 'MENUNGGU'")
                    .bind(&payment_id)
                    .execute(&state.db)
                    .await?;
                sqlx::query("UPDATE orders SET status = 'EXPIRED' WHERE order_id = ? AND status = 'PENDING_PAYMENT'")
                    .bind(&p.order_id)
                    .execute(&state.db)
                    .await?;
                return Ok(Json(json!({ "status": "KADALUARSA", "synced": true, "message": "QRIS sudah kadaluarsa" })));
            }

            if !paid || qr_status != "PAID" {
                return Ok(Json(json!({ "status": p.status, "synced": false, "message": "Masih menunggu pembayaran" })));
            }
        }
        Err(e) => {
            tracing::error!("QR status check failed: {e}");
            return Ok(Json(json!({ "status": p.status, "synced": false, "message": "Gagal cek status QRIS" })));
        }
    }

    // Mark as LUNAS
    sqlx::query("UPDATE payments SET status = 'LUNAS', confirmed_at = NOW(), payment_type = 'QRIS' WHERE payment_id = ? AND status = 'MENUNGGU'")
        .bind(&payment_id)
        .execute(&state.db)
        .await?;

    sqlx::query("UPDATE orders SET status = 'PENDING' WHERE order_id = ? AND status = 'PENDING_PAYMENT'")
        .bind(&p.order_id)
        .execute(&state.db)
        .await?;

    // Process order
    let (order_processed, order_error) = match crate::services::order_processor::process_order_after_payment(&state, &p.order_id).await {
        Ok(_) => (true, None),
        Err(e) => {
            let msg = e.to_string();
            let _ = sqlx::query("UPDATE orders SET status = 'FAILED', status_note = ? WHERE order_id = ?")
                .bind(&msg[..msg.len().min(255)])
                .bind(&p.order_id)
                .execute(&state.db)
                .await;
            (false, Some(msg))
        }
    };

    Ok(Json(json!({
        "status": "LUNAS",
        "synced": true,
        "message": "Pembayaran berhasil terverifikasi",
        "orderProcessed": order_processed,
        "orderError": order_error,
    })))
}

// ── Row types ──────────────────────────────────────────────────────────

#[derive(sqlx::FromRow)]
struct PaymentDetailRow {
    payment_id: String,
    order_id: String,
    amount: String,
    fee: String,
    total_amount: String,
    qris_id: Option<String>,
    trx_id: Option<String>,
    qr_image: Option<String>,
    qris_url: Option<String>,
    gopay_transaction_id: Option<String>,
    payer_issuer: Option<String>,
    payment_type: Option<String>,
    status: String,
    confirmed_at: Option<chrono::NaiveDateTime>,
    expires_at: Option<chrono::NaiveDateTime>,
    created_at: chrono::NaiveDateTime,
    service_name: String,
    user_id: i32,
}

#[derive(sqlx::FromRow)]
struct PaymentSyncRow {
    payment_id: String,
    order_id: String,
    qris_id: Option<String>,
    status: String,
    user_id: i32,
    o_order_id: String,
}
