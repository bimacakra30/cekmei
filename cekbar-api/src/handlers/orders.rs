use std::sync::Arc;
use axum::{
    extract::{Path, Query, State},
    routing::get,
    Extension, Json, Router,
};
use chrono::{NaiveDateTime, Utc};
use serde::Deserialize;
use serde_json::json;

use crate::error::{AppError, AppResult};
use crate::middleware::auth::CurrentUser;
use crate::AppState;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list).post(create))
        .route("/history", get(history))
        .route("/{order_id}/refresh-status", get(refresh_status))
}

// ── Create Order ───────────────────────────────────────────────────────

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateOrderRequest {
    service_id: String,
    service_name: String,
    imei_list: Vec<String>,
}

async fn create(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<CurrentUser>,
    Json(body): Json<CreateOrderRequest>,
) -> AppResult<Json<serde_json::Value>> {
    if body.service_id.is_empty() || body.service_name.is_empty() || body.imei_list.is_empty() {
        return Err(AppError::BadRequest("Data order tidak lengkap".into()));
    }

    if body.imei_list.len() > 10 {
        return Err(AppError::BadRequest("Maksimal 10 IMEI per order".into()));
    }

    let imei_regex = regex_lite::Regex::new(r"^\d{15}$").unwrap();
    let invalid: Vec<&String> = body.imei_list.iter().filter(|i| !imei_regex.is_match(i.trim())).collect();
    if !invalid.is_empty() {
        let preview: Vec<&str> = invalid.iter().take(3).map(|s| s.as_str()).collect();
        return Err(AppError::BadRequest(format!(
            "Format IMEI tidak valid (harus 15 digit angka): {}{}",
            preview.join(", "),
            if invalid.len() > 3 { "..." } else { "" }
        )));
    }

    // Fetch service
    let service: Option<ServiceRow> = sqlx::query_as(
        "SELECT service_id, service_name, CAST(sell_price AS CHAR) as sell_price, CAST(buy_price AS CHAR) as buy_price, is_active, api_provider FROM services WHERE service_id = ? LIMIT 1"
    )
    .bind(&body.service_id)
    .fetch_optional(&state.db)
    .await?;

    let service = service.ok_or_else(|| AppError::NotFound("Layanan tidak ditemukan".into()))?;

    if !service.is_active {
        return Err(AppError::BadRequest("Layanan sedang tidak tersedia".into()));
    }

    let sell_price: f64 = service.sell_price.parse().unwrap_or(0.0);
    let buy_price: f64 = service.buy_price.parse().unwrap_or(0.0);

    if sell_price <= 0.0 {
        return Err(AppError::BadRequest("Harga layanan belum diatur oleh admin".into()));
    }

    let imei_count = body.imei_list.len() as f64;

    // CEIR balance check
    if service.api_provider == "ceir" {
        let total_buy = imei_count * buy_price;
        match state.ceirid.get_balance().await {
            Ok(balance) => {
                let credit = balance.get("credit").and_then(|v| v.as_f64()).unwrap_or(0.0);
                if credit < total_buy {
                    return Ok(Json(json!({
                        "error": "Layanan sedang tidak tersedia untuk saat ini. Silakan hubungi admin.",
                        "errorCode": "INSUFFICIENT_PROVIDER_BALANCE"
                    })));
                }
            }
            Err(_) => {
                return Ok(Json(json!({
                    "error": "Tidak dapat memverifikasi ketersediaan layanan. Silakan coba beberapa saat lagi.",
                    "errorCode": "PROVIDER_UNAVAILABLE"
                })));
            }
        }
    }

    let order_id = crate::utils::id_generator::generate_order_id();
    let imei_json = serde_json::to_string(&body.imei_list).unwrap_or_default();

    // Reseller: direct order (no payment)
    if user.role == crate::models::user::UserRole::Reseller {
        let total_buy = imei_count * buy_price;

        sqlx::query(
            "INSERT INTO orders (order_id, user_id, service_id, service_name, imei_list, total_price, status, is_direct_order, unit_price) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', true, ?)"
        )
        .bind(&order_id)
        .bind(user.id)
        .bind(&service.service_id)
        .bind(&service.service_name)
        .bind(&imei_json)
        .bind(total_buy)
        .bind(buy_price)
        .execute(&state.db)
        .await?;

        // Process order
        match crate::services::order_processor::process_order_after_payment(&state, &order_id).await {
            Ok(_) => {
                let row: Option<(String, Option<String>, Option<String>)> = sqlx::query_as(
                    "SELECT status, CAST(results AS CHAR), ceir_order_id FROM orders WHERE order_id = ?"
                )
                .bind(&order_id)
                .fetch_optional(&state.db)
                .await?;

                let (status, results, ceir_order_id) = row.unwrap_or(("PENDING".into(), None, None));
                let results_val: serde_json::Value = results
                    .and_then(|r| serde_json::from_str(&r).ok())
                    .unwrap_or(serde_json::Value::Null);

                return Ok(Json(json!({
                    "orderId": order_id,
                    "status": status,
                    "results": results_val,
                    "ceirOrderId": ceir_order_id,
                    "totalPrice": total_buy,
                    "serviceName": service.service_name,
                    "isDirectOrder": true
                })));
            }
            Err(e) => {
                return Ok(Json(json!({
                    "orderId": order_id,
                    "status": "FAILED",
                    "error": e.to_string(),
                    "totalPrice": total_buy,
                    "serviceName": service.service_name,
                    "isDirectOrder": true
                })));
            }
        }
    }

    // Regular user: create order + payment + QRIS
    let total_price = imei_count * sell_price;
    let payment_id = crate::utils::id_generator::generate_payment_id();
    let expires_at = Utc::now().naive_utc() + chrono::Duration::seconds(600);

    let mut tx = state.db.begin().await?;

    sqlx::query(
        "INSERT INTO orders (order_id, user_id, service_id, service_name, imei_list, total_price, status, unit_price) VALUES (?, ?, ?, ?, ?, ?, 'PENDING_PAYMENT', ?)"
    )
    .bind(&order_id)
    .bind(user.id)
    .bind(&service.service_id)
    .bind(&service.service_name)
    .bind(&imei_json)
    .bind(total_price)
    .bind(sell_price)
    .execute(&mut *tx)
    .await?;

    sqlx::query(
        "INSERT INTO payments (payment_id, order_id, amount, fee, total_amount, status, expires_at) VALUES (?, ?, ?, 0, ?, 'MENUNGGU', ?)"
    )
    .bind(&payment_id)
    .bind(&order_id)
    .bind(total_price)
    .bind(total_price)
    .bind(expires_at)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    // Create QRIS payment
    let callback_url = format!("{}/api/webhooks/gopay", state.config.app_url.trim_end_matches('/'));
    let mut qris_id = String::new();
    let mut trx_id = String::new();
    let mut qr_image = String::new();
    let mut qris_url = String::new();

    match state.gopay.create_qris_payment(total_price, &callback_url, 600).await {
        Ok(result) => {
            qris_id = result.qris_id.clone();
            trx_id = result.trx_id.clone();
            qr_image = result.qr_image.clone().unwrap_or_default();
            qris_url = result.qris_url.clone().unwrap_or_default();

            sqlx::query("UPDATE payments SET qris_id = ?, trx_id = ?, qr_image = ?, qris_url = ? WHERE payment_id = ?")
                .bind(&qris_id)
                .bind(&trx_id)
                .bind(&qr_image)
                .bind(&qris_url)
                .bind(&payment_id)
                .execute(&state.db)
                .await?;
        }
        Err(e) => {
            tracing::error!("GoPay QRIS creation failed: {e}");
        }
    }

    Ok(Json(json!({
        "orderId": order_id,
        "paymentId": payment_id,
        "totalPrice": total_price,
        "fee": 0,
        "totalAmount": total_price,
        "qrisId": qris_id,
        "trxId": trx_id,
        "qrImage": qr_image,
        "qrisUrl": qris_url,
        "gopayApiUrl": state.config.gopay_api_url,
        "expiresAt": expires_at.and_utc().to_rfc3339(),
        "serviceName": service.service_name,
    })))
}

// ── List Orders ────────────────────────────────────────────────────────

async fn list(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<CurrentUser>,
) -> AppResult<Json<serde_json::Value>> {
    let rows: Vec<OrderListRow> = sqlx::query_as(
        r#"SELECT o.order_id, o.service_id, o.service_name, CAST(o.imei_list AS CHAR) as imei_list, CAST(o.total_price AS CHAR) as total_price,
                  o.status, o.ceir_order_id, CAST(o.results AS CHAR) as results, o.is_direct_order, o.created_at, o.completed_at,
                  p.payment_id, p.status AS payment_status, p.payment_type, p.qris_id
           FROM orders o
           LEFT JOIN payments p ON p.order_id = o.order_id
           WHERE o.user_id = ?
           ORDER BY o.created_at DESC
           LIMIT 50"#,
    )
    .bind(user.id)
    .fetch_all(&state.db)
    .await?;

    let orders: Vec<serde_json::Value> = rows.iter().map(|o| {
        let imei_list: serde_json::Value = serde_json::from_str(&o.imei_list).unwrap_or(json!([]));
        let results: serde_json::Value = o.results.as_deref()
            .and_then(|r| serde_json::from_str(r).ok())
            .unwrap_or(serde_json::Value::Null);

        json!({
            "orderId": o.order_id,
            "serviceId": o.service_id,
            "serviceName": o.service_name,
            "imeiList": imei_list,
            "totalPrice": o.total_price,
            "status": o.status,
            "ceirOrderId": o.ceir_order_id,
            "paymentId": o.payment_id,
            "paymentStatus": o.payment_status,
            "paymentType": o.payment_type,
            "qrisId": o.qris_id,
            "results": results,
            "isDirectOrder": o.is_direct_order,
            "createdAt": o.created_at,
            "completedAt": o.completed_at,
        })
    }).collect();

    Ok(Json(json!({ "orders": orders })))
}

// ── Order History ──────────────────────────────────────────────────────

#[derive(Deserialize)]
struct HistoryQuery {
    category: Option<String>,
    search: Option<String>,
    status: Option<String>,
    page: Option<u32>,
    limit: Option<u32>,
}

async fn history(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<CurrentUser>,
    Query(q): Query<HistoryQuery>,
) -> AppResult<Json<serde_json::Value>> {
    let page = q.page.unwrap_or(1).max(1);
    let limit = q.limit.unwrap_or(20).min(50);
    let offset = (page - 1) * limit;

    let name_cond = match q.category.as_deref() {
        Some("CEIR") => "(LOWER(o.service_name) LIKE '%check%' OR LOWER(o.service_name) LIKE '%cek%' OR LOWER(o.service_name) LIKE '%history%' OR LOWER(o.service_name) LIKE '%ceir%' OR LOWER(o.service_name) LIKE '%validity%' OR LOWER(o.service_name) LIKE '%bea cukai%' OR LOWER(o.service_name) LIKE '%imei status%')",
        Some("UNLOCK_IMEI") => "(LOWER(o.service_name) LIKE '%roamer%' OR LOWER(o.service_name) LIKE '%unlock%' OR LOWER(o.service_name) LIKE '%unblock%' OR LOWER(o.service_name) LIKE '%bulan%' OR LOWER(o.service_name) LIKE '%tahun%')",
        Some("GSM") => "(LOWER(o.service_name) LIKE '%carrier%' OR LOWER(o.service_name) LIKE '%simlock%' OR LOWER(o.service_name) LIKE '%apple%' OR LOWER(o.service_name) LIKE '%icloud%' OR LOWER(o.service_name) LIKE '%gsm%')",
        _ => "1=1",
    };

    let mut where_clause = format!("o.user_id = {} AND {}", user.id, name_cond);
    let mut bind_values: Vec<String> = Vec::new();

    if let Some(ref search) = q.search {
        if !search.is_empty() {
            where_clause.push_str(" AND (o.order_id LIKE ? OR o.service_name LIKE ?)");
            bind_values.push(format!("%{search}%"));
            bind_values.push(format!("%{search}%"));
        }
    }
    if let Some(ref status) = q.status {
        if !status.is_empty() {
            where_clause.push_str(" AND o.status = ?");
            bind_values.push(status.clone());
        }
    }

    // Count
    let count_sql = format!("SELECT COUNT(*) as cnt FROM orders o WHERE {}", where_clause);
    let mut count_query = sqlx::query_scalar::<_, i64>(&count_sql);
    for v in &bind_values {
        count_query = count_query.bind(v);
    }
    let total = count_query.fetch_one(&state.db).await.unwrap_or(0);

    // Fetch rows
    let data_sql = format!(
        r#"SELECT o.order_id, o.service_id, o.service_name, CAST(o.imei_list AS CHAR) as imei_list, CAST(o.total_price AS CHAR) as total_price,
                  o.status, o.dhru_order_id, o.ceir_order_id, o.roamer_months, o.status_note,
                  CAST(o.unit_price AS CHAR) as unit_price, o.admin_note, o.is_manual_order, o.is_direct_order,
                  o.created_at, o.updated_at, o.completed_at, CAST(o.results AS CHAR) as results,
                  p.payment_id, p.payment_type, p.status AS payment_status, p.confirmed_at
           FROM orders o
           LEFT JOIN payments p ON p.order_id = o.order_id
           WHERE {}
           ORDER BY o.created_at DESC
           LIMIT {} OFFSET {}"#,
        where_clause, limit, offset
    );

    let mut data_query = sqlx::query_as::<_, HistoryRow>(&data_sql);
    for v in &bind_values {
        data_query = data_query.bind(v);
    }
    let rows: Vec<HistoryRow> = data_query.fetch_all(&state.db).await?;

    let orders: Vec<serde_json::Value> = rows.iter().map(|r| {
        let imei_list: serde_json::Value = serde_json::from_str(&r.imei_list).unwrap_or(json!([]));
        let results: serde_json::Value = r.results.as_deref()
            .and_then(|s| serde_json::from_str(s).ok())
            .unwrap_or(serde_json::Value::Null);

        json!({
            "orderId": r.order_id,
            "serviceId": r.service_id,
            "serviceName": r.service_name,
            "imeiList": imei_list,
            "totalPrice": r.total_price,
            "status": r.status,
            "dhruOrderId": r.dhru_order_id,
            "ceirOrderId": r.ceir_order_id,
            "roamerMonths": r.roamer_months,
            "statusNote": r.status_note,
            "unitPrice": r.unit_price,
            "paymentId": r.payment_id,
            "paymentType": r.payment_type,
            "paymentStatus": r.payment_status,
            "confirmedAt": r.confirmed_at,
            "completedAt": r.completed_at,
            "createdAt": r.created_at,
            "updatedAt": r.updated_at,
            "results": results,
            "isDirectOrder": r.is_direct_order,
            "adminNote": r.admin_note,
            "isManualOrder": r.is_manual_order,
        })
    }).collect();

    let total_pages = ((total as f64) / (limit as f64)).ceil() as i64;

    Ok(Json(json!({
        "orders": orders,
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": total_pages
        }
    })))
}

// ── Refresh Status ─────────────────────────────────────────────────────

async fn refresh_status(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<CurrentUser>,
    Path(order_id): Path<String>,
) -> AppResult<Json<serde_json::Value>> {
    let row: Option<RefreshRow> = sqlx::query_as(
        r#"SELECT o.order_id, o.user_id, o.status, o.ceir_order_id, o.roamer_months, o.status_note, CAST(o.results AS CHAR) as results,
                  s.api_type
           FROM orders o
           LEFT JOIN services s ON s.service_name = o.service_name
           WHERE o.order_id = ? AND o.user_id = ?
           LIMIT 1"#,
    )
    .bind(&order_id)
    .bind(user.id)
    .fetch_optional(&state.db)
    .await?;

    let order = row.ok_or_else(|| AppError::NotFound("Order tidak ditemukan".into()))?;
    let api_type = order.api_type.unwrap_or_default();

    // Final status
    if order.status == "SUCCESS" || order.status == "FAILED" {
        let results: serde_json::Value = order.results.as_deref()
            .and_then(|r| serde_json::from_str(r).ok())
            .unwrap_or(serde_json::Value::Null);
        return Ok(Json(json!({
            "orderId": order.order_id,
            "status": order.status,
            "statusNote": order.status_note,
            "results": results,
            "final": true
        })));
    }

    // Roamer status poll
    if api_type == "roamer" {
        if let Some(ref ceir_id) = order.ceir_order_id {
            let ceir_status = state.ceirid.get_roamer_status(ceir_id).await?;
            let order_status = ceir_status.get("order_status").and_then(|v| v.as_str()).unwrap_or("processing");
            let new_status = map_ceirid_status(order_status);
            let status_note_raw = ceir_status.get("status_note").and_then(|v| v.as_str()).unwrap_or("-");
            let status_note = if status_note_raw == "-" { "Menunggu proses..." } else { status_note_raw };

            if new_status != order.status || Some(status_note.to_string()) != order.status_note {
                let completed = if new_status == "SUCCESS" { "NOW()" } else { "NULL" };
                sqlx::query(&format!(
                    "UPDATE orders SET status = ?, status_note = ?, completed_at = {} WHERE order_id = ?",
                    completed
                ))
                .bind(&new_status)
                .bind(status_note)
                .bind(&order_id)
                .execute(&state.db)
                .await?;
            }

            return Ok(Json(json!({
                "orderId": order.order_id,
                "status": new_status,
                "statusNote": status_note,
                "ceirStatus": order_status,
                "final": new_status == "SUCCESS" || new_status == "FAILED"
            })));
        }
    }

    // CEIR check status poll
    if api_type == "ceir" {
        if let Some(ref ceir_id) = order.ceir_order_id {
            let ceir_status = state.ceirid.get_order_status(ceir_id).await?;
            let result = ceir_status.get("result").cloned();

            if result.is_some() && order.results.is_none() {
                sqlx::query(
                    "UPDATE orders SET results = ?, status = 'SUCCESS', completed_at = NOW() WHERE order_id = ?"
                )
                .bind(serde_json::to_string(&ceir_status).unwrap_or_default())
                .bind(&order_id)
                .execute(&state.db)
                .await?;
            }

            return Ok(Json(json!({
                "orderId": order.order_id,
                "status": "SUCCESS",
                "ceirOrderStatus": ceir_status.get("status"),
                "result": ceir_status.get("result"),
                "final": true
            })));
        }
    }

    Ok(Json(json!({
        "orderId": order.order_id,
        "status": order.status,
        "statusNote": order.status_note,
        "message": "Tidak bisa poll status dari CEIR (ceir_order_id tidak ada)"
    })))
}

// ── Helper types ───────────────────────────────────────────────────────

#[derive(sqlx::FromRow)]
struct ServiceRow {
    service_id: String,
    service_name: String,
    sell_price: String,
    buy_price: String,
    is_active: bool,
    api_provider: String,
}

#[derive(sqlx::FromRow)]
struct OrderListRow {
    order_id: String,
    service_id: String,
    service_name: String,
    imei_list: String,
    total_price: String,
    status: String,
    ceir_order_id: Option<String>,
    results: Option<String>,
    is_direct_order: bool,
    created_at: NaiveDateTime,
    completed_at: Option<NaiveDateTime>,
    payment_id: Option<String>,
    payment_status: Option<String>,
    payment_type: Option<String>,
    qris_id: Option<String>,
}

#[derive(sqlx::FromRow)]
struct HistoryRow {
    order_id: String,
    service_id: String,
    service_name: String,
    imei_list: String,
    total_price: String,
    status: String,
    dhru_order_id: Option<String>,
    ceir_order_id: Option<String>,
    roamer_months: Option<i8>,
    status_note: Option<String>,
    unit_price: Option<String>,
    admin_note: Option<String>,
    is_manual_order: bool,
    is_direct_order: bool,
    created_at: NaiveDateTime,
    updated_at: NaiveDateTime,
    completed_at: Option<NaiveDateTime>,
    results: Option<String>,
    payment_id: Option<String>,
    payment_type: Option<String>,
    payment_status: Option<String>,
    confirmed_at: Option<NaiveDateTime>,
}

#[derive(sqlx::FromRow)]
struct RefreshRow {
    order_id: String,
    user_id: i32,
    status: String,
    ceir_order_id: Option<String>,
    roamer_months: Option<i8>,
    status_note: Option<String>,
    results: Option<String>,
    api_type: Option<String>,
}

fn map_ceirid_status(status: &str) -> String {
    match status {
        "pending" => "PENDING".into(),
        "processing" => "PROCESSING".into(),
        "success" => "SUCCESS".into(),
        "failed" => "FAILED".into(),
        _ => "PROCESSING".into(),
    }
}
