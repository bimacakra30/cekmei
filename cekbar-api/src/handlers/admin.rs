use std::sync::Arc;
use axum::{
    Router,
    routing::{get, post, patch},
    extract::{State, Path, Query},
    Json,
};
use serde::Deserialize;
use serde_json::json;

use crate::error::{AppError, AppResult};
use crate::middleware::auth::CurrentUser;
use crate::models::user::UserRole;
use crate::AppState;

fn is_admin(user: &CurrentUser) -> bool {
    user.role == UserRole::Admin || user.role == UserRole::Superadmin
}

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/stats", get(get_stats))
        .route("/orders", get(get_orders))
        .route("/orders/manual", get(get_manual_orders))
        .route("/orders/{orderId}/process", patch(process_order))
        .route("/services", get(get_services).post(create_service))
        .route("/services/{id}", patch(update_service).delete(delete_service))
        .route("/services/sync", post(sync_services))
        .route("/services/sync-status", get(sync_status))
        .route("/services/batch", patch(batch_update_services).delete(batch_delete_services))
        .route("/users", get(get_users).post(create_user))
        .route("/users/{id}", patch(update_user).delete(delete_user))
        .route("/transactions", get(get_transactions))
        .route("/info", get(get_info))
}

// ── Helpers ────────────────────────────────────────────────────────────

fn date_filter(range: &str, col: &str) -> String {
    match range {
        "week" => format!("AND {} >= DATE_SUB(NOW(), INTERVAL 7 DAY)", col),
        "month" => format!("AND {} >= DATE_SUB(NOW(), INTERVAL 30 DAY)", col),
        _ => format!("AND DATE({}) = CURDATE()", col),
    }
}

// ── GET /admin/stats ───────────────────────────────────────────────────

#[derive(Deserialize)]
struct StatsQuery {
    range: Option<String>,
}

async fn get_stats(
    State(state): State<Arc<AppState>>,
    user: CurrentUser,
    Query(q): Query<StatsQuery>,
) -> AppResult<Json<serde_json::Value>> {
    if !is_admin(&user) {
        return Err(AppError::Forbidden);
    }

    let range = q.range.as_deref().unwrap_or("today");
    let order_df = date_filter(range, "o.created_at");
    let pay_df = date_filter(range, "p.confirmed_at");

    // Revenue
    let rev: (String,) = sqlx::query_as(&format!(
        "SELECT CAST(COALESCE(SUM(total_amount), 0) AS CHAR) AS total FROM payments p WHERE p.status = 'LUNAS' {}", pay_df
    )).fetch_one(&state.db).await?;
    let total_revenue: f64 = rev.0.parse().unwrap_or(0.0);

    // Seller cost
    let seller: (String,) = sqlx::query_as(&format!(
        "SELECT CAST(COALESCE(SUM(s.buy_price * JSON_LENGTH(o.imei_list)), 0) AS CHAR) AS total \
         FROM orders o JOIN payments p ON p.order_id = o.order_id JOIN services s ON s.service_id = o.service_id \
         WHERE p.status = 'LUNAS' {}", pay_df
    )).fetch_one(&state.db).await?;
    let total_seller: f64 = seller.0.parse().unwrap_or(0.0);

    // Order count
    let oc: (i64,) = sqlx::query_as(&format!(
        "SELECT COUNT(*) FROM orders o WHERE 1=1 {}", order_df
    )).fetch_one(&state.db).await?;

    // Failed
    let fc: (i64,) = sqlx::query_as(&format!(
        "SELECT COUNT(*) FROM orders o WHERE o.status = 'FAILED' {}", order_df
    )).fetch_one(&state.db).await?;

    // Active users
    let au: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM users WHERE status = 'active' AND role = 'user'"
    ).fetch_one(&state.db).await?;

    // Orders today
    let ot: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()"
    ).fetch_one(&state.db).await?;

    // Pending
    let po: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM orders WHERE status IN ('PENDING_PAYMENT', 'PENDING')"
    ).fetch_one(&state.db).await?;

    // Success
    let sc: (i64,) = sqlx::query_as(&format!(
        "SELECT COUNT(*) FROM orders o WHERE o.status = 'SUCCESS' {}", order_df
    )).fetch_one(&state.db).await?;

    // Revenue chart (last 7 days)
    let chart_rows: Vec<(String, String, i64)> = sqlx::query_as(
        "SELECT DATE_FORMAT(DATE(confirmed_at), '%Y-%m-%d') as day, \
         CAST(COALESCE(SUM(total_amount), 0) AS CHAR), COUNT(*) \
         FROM payments WHERE status = 'LUNAS' AND confirmed_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) \
         GROUP BY day ORDER BY day ASC"
    ).fetch_all(&state.db).await?;

    let mut daily_revenue = Vec::new();
    let today = chrono::Utc::now().date_naive();
    for i in (0..7).rev() {
        let day = today - chrono::Duration::days(i);
        let day_str = day.format("%Y-%m-%d").to_string();
        let found = chart_rows.iter().find(|r| r.0 == day_str);
        daily_revenue.push(json!({
            "day": day_str,
            "revenue": found.map(|r| r.1.parse::<f64>().unwrap_or(0.0)).unwrap_or(0.0),
            "count": found.map(|r| r.2).unwrap_or(0),
        }));
    }

    // Status chart
    let status_rows: Vec<(String, i64)> = sqlx::query_as(
        "SELECT status, COUNT(*) FROM orders GROUP BY status"
    ).fetch_all(&state.db).await?;
    let status_chart: Vec<serde_json::Value> = status_rows.iter().map(|(s, t)| json!({"status": s, "total": t})).collect();

    // Top services
    let top_rows: Vec<(String, i64, String)> = sqlx::query_as(
        "SELECT service_name, COUNT(*) as cnt, CAST(COALESCE(SUM(total_price),0) AS CHAR) \
         FROM orders GROUP BY service_name ORDER BY cnt DESC LIMIT 5"
    ).fetch_all(&state.db).await?;
    let top_services: Vec<serde_json::Value> = top_rows.iter().map(|(n, t, r)| json!({
        "name": n, "orders": t, "revenue": r.parse::<f64>().unwrap_or(0.0)
    })).collect();

    // Recent orders
    let recent_rows: Vec<(String, String, String, String, String, chrono::NaiveDateTime, Option<String>)> = sqlx::query_as(&format!(
        "SELECT o.order_id, u.username, o.service_name, CAST(o.total_price AS CHAR), o.status, o.created_at, p.payment_type \
         FROM orders o JOIN users u ON u.id = o.user_id LEFT JOIN payments p ON p.order_id = o.order_id \
         WHERE 1=1 {} ORDER BY o.created_at DESC LIMIT 20", order_df
    )).fetch_all(&state.db).await?;

    let recent_orders: Vec<serde_json::Value> = recent_rows.iter().map(|(oid, uname, sname, price, status, created, ptype)| json!({
        "id": oid, "user": uname, "service": sname,
        "amount": price.parse::<f64>().unwrap_or(0.0),
        "status": status, "paymentType": ptype, "date": created.format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string(),
    })).collect();

    // CEIR balance
    let ceir_balance: Option<f64> = match state.ceirid.get_balance().await {
        Ok(b) => b.get("data").and_then(|d| d.get("credit")).and_then(|v| v.as_f64())
            .or_else(|| b.get("credit").and_then(|v| v.as_f64())),
        Err(e) => { tracing::error!("Gagal fetch saldo CEIR: {}", e); None }
    };

    Ok(Json(json!({
        "stats": {
            "totalRevenue": total_revenue,
            "totalSeller": total_seller,
            "netRevenue": total_revenue - total_seller,
            "totalOrders": oc.0,
            "totalSuccess": sc.0,
            "totalFailed": fc.0,
            "activeUsers": au.0,
            "ordersToday": ot.0,
            "pendingOrders": po.0,
            "ceirBalance": ceir_balance,
        },
        "charts": {
            "dailyRevenue": daily_revenue,
            "statusChart": status_chart,
            "topServices": top_services,
        },
        "recentOrders": recent_orders,
        "range": range,
    })))
}

// ── GET /admin/orders ──────────────────────────────────────────────────

#[derive(Deserialize)]
struct AdminOrdersQuery {
    #[serde(rename = "paymentStatus")]
    payment_status: Option<String>,
    #[serde(rename = "orderStatus")]
    order_status: Option<String>,
}

async fn get_orders(
    State(state): State<Arc<AppState>>,
    user: CurrentUser,
    Query(q): Query<AdminOrdersQuery>,
) -> AppResult<Json<serde_json::Value>> {
    if !is_admin(&user) {
        return Err(AppError::Forbidden);
    }

    let mut conditions = Vec::new();
    let mut params: Vec<String> = Vec::new();

    if let Some(ref ps) = q.payment_status {
        conditions.push("p.status = ?".to_string());
        params.push(ps.clone());
    }
    if let Some(ref os) = q.order_status {
        conditions.push("o.status = ?".to_string());
        params.push(os.clone());
    }

    let where_clause = if conditions.is_empty() { String::new() } else { format!("WHERE {}", conditions.join(" AND ")) };

    let sql = format!(
        "SELECT o.order_id, o.service_name, CAST(o.imei_list AS CHAR) as imei_list, CAST(o.total_price AS CHAR) as total_price, \
         o.status AS order_status, o.ceir_order_id, o.status_note, o.roamer_months, CAST(o.results AS CHAR) as results, \
         o.admin_note, o.is_manual_order, o.created_at, o.updated_at, o.completed_at, \
         u.username, u.email, u.nama, \
         p.payment_id, CAST(p.total_amount AS CHAR) as total_amount, p.status AS payment_status, \
         p.confirmed_at, p.payment_type, p.gopay_transaction_id \
         FROM orders o JOIN users u ON u.id = o.user_id LEFT JOIN payments p ON p.order_id = o.order_id \
         {} ORDER BY o.created_at DESC LIMIT 200", where_clause
    );

    // Build query dynamically
    let mut query = sqlx::query_as::<_, AdminOrderRow>(&sql);
    for p in &params {
        query = query.bind(p);
    }
    let rows: Vec<AdminOrderRow> = query.fetch_all(&state.db).await?;

    let orders: Vec<serde_json::Value> = rows.iter().map(|r| {
        let imei_list = parse_json_or_null(&r.imei_list);
        let results = r.results.as_deref().and_then(|s| serde_json::from_str::<serde_json::Value>(s).ok());
        json!({
            "orderId": r.order_id, "serviceName": r.service_name,
            "imeiList": imei_list, "totalPrice": r.total_price.parse::<f64>().unwrap_or(0.0),
            "orderStatus": r.order_status, "ceirOrderId": r.ceir_order_id,
            "statusNote": r.status_note, "roamerMonths": r.roamer_months,
            "results": results, "paymentId": r.payment_id,
            "paymentStatus": r.payment_status,
            "totalAmount": r.total_amount.as_deref().map(|s| s.parse::<f64>().unwrap_or(0.0)),
            "username": r.username, "email": r.email, "nama": r.nama,
            "confirmedAt": r.confirmed_at.map(|d| d.format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string()),
            "completedAt": r.completed_at.map(|d| d.format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string()),
            "createdAt": r.created_at.format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string(),
        })
    }).collect();

    Ok(Json(json!({ "orders": orders })))
}

#[derive(sqlx::FromRow)]
struct AdminOrderRow {
    order_id: String,
    service_name: String,
    imei_list: Option<String>,
    total_price: String,
    order_status: String,
    ceir_order_id: Option<String>,
    status_note: Option<String>,
    roamer_months: Option<i8>,
    results: Option<String>,
    admin_note: Option<String>,
    is_manual_order: bool,
    created_at: chrono::NaiveDateTime,
    updated_at: chrono::NaiveDateTime,
    completed_at: Option<chrono::NaiveDateTime>,
    username: String,
    email: String,
    nama: String,
    payment_id: Option<String>,
    total_amount: Option<String>,
    payment_status: Option<String>,
    confirmed_at: Option<chrono::NaiveDateTime>,
    payment_type: Option<String>,
    gopay_transaction_id: Option<String>,
}

fn parse_json_or_null(s: &Option<String>) -> serde_json::Value {
    s.as_deref()
        .and_then(|v| serde_json::from_str(v).ok())
        .unwrap_or(serde_json::Value::Null)
}

// ── PATCH /admin/orders/:orderId/process ───────────────────────────────

#[derive(Deserialize)]
struct ProcessOrderBody {
    action: String,
    admin_note: Option<String>,
}

async fn process_order(
    State(state): State<Arc<AppState>>,
    user: CurrentUser,
    Path(order_id): Path<String>,
    Json(body): Json<ProcessOrderBody>,
) -> AppResult<Json<serde_json::Value>> {
    if !is_admin(&user) {
        return Err(AppError::Forbidden);
    }

    if body.action.is_empty() {
        return Err(AppError::BadRequest("Action wajib diisi".into()));
    }

    let row: Option<(String, String, bool, Option<String>)> = sqlx::query_as(
        "SELECT order_id, status, is_manual_order, admin_note FROM orders WHERE order_id = ? LIMIT 1"
    ).bind(&order_id).fetch_optional(&state.db).await?;

    let (_, current_status, is_manual, _) = row.ok_or_else(|| AppError::NotFound("Order tidak ditemukan".into()))?;

    if !is_manual {
        return Err(AppError::BadRequest("Order ini bukan order manual".into()));
    }

    let target = body.action.to_uppercase();
    let allowed: &[&str] = match current_status.as_str() {
        "PENDING" => &["PROCESSING", "FAILED"],
        "PROCESSING" => &["SUCCESS", "FAILED"],
        _ => &[],
    };

    if !allowed.contains(&target.as_str()) {
        return Err(AppError::BadRequest(format!("Tidak bisa ubah status dari {} ke {}", current_status, target)));
    }

    let now = chrono::Utc::now().naive_utc();
    let status_note = match target.as_str() {
        "PROCESSING" => body.admin_note.as_deref().unwrap_or("Sedang diproses oleh admin").to_string(),
        "SUCCESS" => body.admin_note.as_deref().unwrap_or("Pesanan selesai diproses").to_string(),
        "FAILED" => body.admin_note.as_deref().unwrap_or("Pesanan gagal diproses").to_string(),
        _ => String::new(),
    };

    match target.as_str() {
        "PROCESSING" => {
            sqlx::query(
                "UPDATE orders SET status = ?, status_note = ?, processed_by = ?, processed_at = ?, admin_note = COALESCE(?, admin_note) WHERE order_id = ?"
            )
            .bind(&target).bind(&status_note).bind(user.id).bind(now).bind(&body.admin_note).bind(&order_id)
            .execute(&state.db).await?;
        }
        "SUCCESS" | "FAILED" => {
            sqlx::query(
                "UPDATE orders SET status = ?, status_note = ?, completed_at = ?, admin_note = COALESCE(?, admin_note) WHERE order_id = ?"
            )
            .bind(&target).bind(&status_note).bind(now).bind(&body.admin_note).bind(&order_id)
            .execute(&state.db).await?;
        }
        _ => {}
    }

    Ok(Json(json!({ "success": true, "status": target })))
}

// ── GET /admin/orders/manual ───────────────────────────────────────────

#[derive(Deserialize)]
struct ManualOrdersQuery {
    status: Option<String>,
    search: Option<String>,
    page: Option<u32>,
    limit: Option<u32>,
}

async fn get_manual_orders(
    State(state): State<Arc<AppState>>,
    user: CurrentUser,
    Query(q): Query<ManualOrdersQuery>,
) -> AppResult<Json<serde_json::Value>> {
    if !is_admin(&user) {
        return Err(AppError::Forbidden);
    }

    let page = q.page.unwrap_or(1).max(1);
    let limit = q.limit.unwrap_or(20).min(50);
    let offset = (page - 1) * limit;

    let mut conditions = vec!["o.is_manual_order = 1".to_string()];
    let mut params: Vec<String> = Vec::new();

    if let Some(ref s) = q.status {
        if s != "ALL" {
            conditions.push("o.status = ?".to_string());
            params.push(s.clone());
        }
    }

    if let Some(ref search) = q.search {
        if !search.is_empty() {
            conditions.push("(o.order_id LIKE ? OR o.service_name LIKE ? OR u.username LIKE ? OR u.email LIKE ?)".to_string());
            let pat = format!("%{}%", search);
            params.push(pat.clone());
            params.push(pat.clone());
            params.push(pat.clone());
            params.push(pat);
        }
    }

    let where_clause = conditions.join(" AND ");

    // Count
    let count_sql = format!(
        "SELECT COUNT(*) FROM orders o JOIN users u ON u.id = o.user_id WHERE {}", where_clause
    );
    let mut count_q = sqlx::query_as::<_, (i64,)>(&count_sql);
    for p in &params { count_q = count_q.bind(p); }
    let (total,) = count_q.fetch_one(&state.db).await?;

    // Data
    let data_sql = format!(
        "SELECT o.order_id, o.service_id, o.service_name, CAST(o.imei_list AS CHAR) as imei_list, CAST(o.total_price AS CHAR) as total_price, \
         o.status AS order_status, o.ceir_order_id, o.status_note, o.roamer_months, CAST(o.results AS CHAR) as results, o.admin_note, \
         o.processed_by, o.processed_at, o.is_direct_order, o.created_at, o.updated_at, o.completed_at, \
         u.id, u.username, u.email, u.nama, \
         p.payment_id, CAST(p.total_amount AS CHAR) as total_amount, p.status AS payment_status, p.confirmed_at, p.payment_type \
         FROM orders o JOIN users u ON u.id = o.user_id LEFT JOIN payments p ON p.order_id = o.order_id \
         WHERE {} \
         ORDER BY CASE o.status WHEN 'PENDING' THEN 1 WHEN 'PROCESSING' THEN 2 WHEN 'SUCCESS' THEN 3 WHEN 'FAILED' THEN 4 ELSE 5 END, \
         o.created_at DESC LIMIT ? OFFSET ?", where_clause
    );
    let mut data_q = sqlx::query_as::<_, ManualOrderRow>(&data_sql);
    for p in &params { data_q = data_q.bind(p); }
    data_q = data_q.bind(limit).bind(offset);
    let rows: Vec<ManualOrderRow> = data_q.fetch_all(&state.db).await?;

    let orders: Vec<serde_json::Value> = rows.iter().map(|r| {
        json!({
            "orderId": r.order_id, "serviceId": r.service_id, "serviceName": r.service_name,
            "imeiList": parse_json_or_null(&r.imei_list),
            "totalPrice": r.total_price.parse::<f64>().unwrap_or(0.0),
            "orderStatus": r.order_status, "ceirOrderId": r.ceir_order_id,
            "statusNote": r.status_note, "roamerMonths": r.roamer_months,
            "results": r.results.as_deref().and_then(|s| serde_json::from_str::<serde_json::Value>(s).ok()),
            "adminNote": r.admin_note, "processedBy": r.processed_by,
            "processedAt": r.processed_at.map(|d| d.format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string()),
            "isDirectOrder": r.is_direct_order,
            "paymentId": r.payment_id, "paymentStatus": r.payment_status,
            "totalAmount": r.total_amount.as_deref().map(|s| s.parse::<f64>().unwrap_or(0.0)),
            "confirmedAt": r.confirmed_at.map(|d| d.format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string()),
            "paymentType": r.payment_type,
            "username": r.username, "email": r.email, "nama": r.nama,
            "completedAt": r.completed_at.map(|d| d.format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string()),
            "createdAt": r.created_at.format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string(),
            "updatedAt": r.updated_at.format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string(),
        })
    }).collect();

    // Status counts
    let sc_rows: Vec<(String, i64)> = sqlx::query_as(
        "SELECT status, COUNT(*) FROM orders WHERE is_manual_order = 1 GROUP BY status"
    ).fetch_all(&state.db).await?;
    let mut status_counts = serde_json::Map::new();
    for (s, c) in &sc_rows {
        status_counts.insert(s.clone(), json!(c));
    }

    let total_pages = ((total as f64) / (limit as f64)).ceil() as u32;

    Ok(Json(json!({
        "orders": orders,
        "pagination": { "total": total, "page": page, "limit": limit, "totalPages": total_pages },
        "statusCounts": status_counts,
    })))
}

#[derive(sqlx::FromRow)]
struct ManualOrderRow {
    order_id: String,
    service_id: String,
    service_name: String,
    imei_list: Option<String>,
    total_price: String,
    order_status: String,
    ceir_order_id: Option<String>,
    status_note: Option<String>,
    roamer_months: Option<i8>,
    results: Option<String>,
    admin_note: Option<String>,
    processed_by: Option<i32>,
    processed_at: Option<chrono::NaiveDateTime>,
    is_direct_order: bool,
    created_at: chrono::NaiveDateTime,
    updated_at: chrono::NaiveDateTime,
    completed_at: Option<chrono::NaiveDateTime>,
    #[sqlx(rename = "id")]
    _user_id: i32,
    username: String,
    email: String,
    nama: String,
    payment_id: Option<String>,
    total_amount: Option<String>,
    payment_status: Option<String>,
    confirmed_at: Option<chrono::NaiveDateTime>,
    payment_type: Option<String>,
}

// ── GET /admin/services ────────────────────────────────────────────────

#[derive(Deserialize)]
struct ServicesQuery {
    group: Option<String>,
    search: Option<String>,
}

async fn get_services(
    State(state): State<Arc<AppState>>,
    user: CurrentUser,
    Query(q): Query<ServicesQuery>,
) -> AppResult<Json<serde_json::Value>> {
    if !is_admin(&user) {
        return Err(AppError::Forbidden);
    }

    let mut conditions = Vec::new();
    let mut params: Vec<String> = Vec::new();

    if let Some(ref g) = q.group {
        if g != "ALL" {
            conditions.push("group_name = ?".to_string());
            params.push(g.clone());
        }
    }
    if let Some(ref s) = q.search {
        if !s.is_empty() {
            conditions.push("(service_name LIKE ? OR service_id LIKE ?)".to_string());
            let pat = format!("%{}%", s);
            params.push(pat.clone());
            params.push(pat);
        }
    }

    let where_clause = if conditions.is_empty() { String::new() } else { format!("WHERE {}", conditions.join(" AND ")) };

    let sql = format!(
        "SELECT id, service_id, service_name, group_name, category, api_provider, api_service_id, \
         CAST(buy_price AS CHAR) as buy_price, CAST(sell_price AS CHAR) as sell_price, \
         time_info, info, is_active, min_qty, max_qty, custom_field_name, custom_field_regex, \
         custom_field_maxlen, allow_bulk, api_type, last_synced_at, created_at, updated_at \
         FROM services {} ORDER BY group_name ASC, service_name ASC", where_clause
    );

    let mut query = sqlx::query_as::<_, ServiceRow>(&sql);
    for p in &params { query = query.bind(p); }
    let rows: Vec<ServiceRow> = query.fetch_all(&state.db).await?;

    let groups: Vec<(String,)> = sqlx::query_as(
        "SELECT DISTINCT group_name FROM services ORDER BY group_name ASC"
    ).fetch_all(&state.db).await?;

    let total = rows.len();
    let services: Vec<serde_json::Value> = rows.iter().map(|r| json!({
        "id": r.id, "service_id": r.service_id, "service_name": r.service_name,
        "group_name": r.group_name, "category": r.category,
        "api_provider": r.api_provider, "api_service_id": r.api_service_id,
        "buy_price": r.buy_price.parse::<f64>().unwrap_or(0.0),
        "sell_price": r.sell_price.parse::<f64>().unwrap_or(0.0),
        "time_info": r.time_info, "info": r.info, "is_active": r.is_active,
        "min_qty": r.min_qty, "max_qty": r.max_qty,
        "custom_field_name": r.custom_field_name, "custom_field_regex": r.custom_field_regex,
        "custom_field_maxlen": r.custom_field_maxlen, "allow_bulk": r.allow_bulk,
        "api_type": r.api_type, "last_synced_at": r.last_synced_at,
    })).collect();

    Ok(Json(json!({
        "services": services,
        "groups": groups.iter().map(|g| &g.0).collect::<Vec<_>>(),
        "total": total,
    })))
}

#[derive(sqlx::FromRow)]
struct ServiceRow {
    id: i32,
    service_id: String,
    service_name: String,
    group_name: String,
    category: Option<String>,
    api_provider: String,
    api_service_id: Option<String>,
    buy_price: String,
    sell_price: String,
    time_info: String,
    info: Option<String>,
    is_active: bool,
    min_qty: i32,
    max_qty: String,
    custom_field_name: String,
    custom_field_regex: String,
    custom_field_maxlen: String,
    allow_bulk: bool,
    api_type: Option<String>,
    last_synced_at: Option<chrono::NaiveDateTime>,
    created_at: chrono::NaiveDateTime,
    updated_at: chrono::NaiveDateTime,
}

// ── POST /admin/services ───────────────────────────────────────────────

#[derive(Deserialize)]
struct CreateServiceBody {
    service_id: Option<String>,
    service_name: String,
    group_name: String,
    category: Option<String>,
    api_provider: Option<String>,
    api_service_id: Option<String>,
    buy_price: Option<f64>,
    sell_price: Option<f64>,
    time_info: Option<String>,
    info: Option<String>,
    is_active: Option<bool>,
}

async fn create_service(
    State(state): State<Arc<AppState>>,
    user: CurrentUser,
    Json(body): Json<CreateServiceBody>,
) -> AppResult<Json<serde_json::Value>> {
    if !is_admin(&user) {
        return Err(AppError::Forbidden);
    }

    let sname = body.service_name.trim();
    if sname.is_empty() {
        return Err(AppError::BadRequest("Nama layanan wajib diisi".into()));
    }
    let gname = body.group_name.trim();
    if gname.is_empty() {
        return Err(AppError::BadRequest("Nama grup wajib diisi".into()));
    }

    let sid = match &body.service_id {
        Some(s) if !s.trim().is_empty() => {
            if s.trim().contains(' ') {
                return Err(AppError::BadRequest("Service ID tidak boleh mengandung spasi".into()));
            }
            s.trim().to_string()
        }
        _ => {
            use std::time::{SystemTime, UNIX_EPOCH};
            let ts = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis();
            let rand: u32 = (ts & 0xFFFFF) as u32;
            format!("manual-{}-{:05x}", ts, rand)
        }
    };

    let result = sqlx::query(
        "INSERT INTO services (service_id, service_name, group_name, category, api_provider, api_service_id, \
         buy_price, sell_price, time_info, info, is_active) \
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&sid).bind(sname).bind(gname)
    .bind(&body.category)
    .bind(body.api_provider.as_deref().unwrap_or("manual"))
    .bind(&body.api_service_id)
    .bind(body.buy_price.unwrap_or(0.0))
    .bind(body.sell_price.unwrap_or(0.0))
    .bind(body.time_info.as_deref().unwrap_or(""))
    .bind(body.info.as_deref().unwrap_or(""))
    .bind(body.is_active.unwrap_or(true))
    .execute(&state.db).await;

    match result {
        Ok(_) => Ok(Json(json!({ "service": { "service_id": sid } }))),
        Err(e) => {
            let msg = e.to_string();
            if msg.contains("Duplicate") || msg.contains("1062") {
                Err(AppError::Conflict("Service ID sudah ada, gunakan ID yang berbeda".into()))
            } else {
                Err(AppError::Internal("Gagal menambahkan layanan".into()))
            }
        }
    }
}

// ── PATCH /admin/services/:id ──────────────────────────────────────────

async fn update_service(
    State(state): State<Arc<AppState>>,
    user: CurrentUser,
    Path(id): Path<i32>,
    Json(body): Json<serde_json::Value>,
) -> AppResult<Json<serde_json::Value>> {
    if !is_admin(&user) {
        return Err(AppError::Forbidden);
    }

    let mut sets = Vec::new();
    let mut vals: Vec<String> = Vec::new();

    macro_rules! field_str {
        ($name:expr) => {
            if let Some(v) = body.get($name) {
                sets.push(format!("{} = ?", $name));
                vals.push(v.as_str().unwrap_or("").to_string());
            }
        };
    }
    macro_rules! field_num {
        ($name:expr) => {
            if let Some(v) = body.get($name) {
                sets.push(format!("{} = ?", $name));
                vals.push(v.to_string());
            }
        };
    }

    field_str!("service_name");
    field_str!("group_name");
    field_str!("category");
    field_str!("api_provider");
    field_str!("api_service_id");
    field_str!("time_info");
    field_str!("info");
    field_num!("buy_price");
    field_num!("sell_price");

    if let Some(v) = body.get("is_active") {
        sets.push("is_active = ?".to_string());
        vals.push(if v.as_bool().unwrap_or(false) { "1".to_string() } else { "0".to_string() });
    }

    if sets.is_empty() {
        return Err(AppError::BadRequest("Tidak ada field yang diupdate".into()));
    }

    let sql = format!("UPDATE services SET {} WHERE id = ?", sets.join(", "));
    let mut q = sqlx::query(&sql);
    for v in &vals { q = q.bind(v); }
    q = q.bind(id);
    let r = q.execute(&state.db).await?;

    if r.rows_affected() == 0 {
        return Err(AppError::NotFound("Layanan tidak ditemukan".into()));
    }

    Ok(Json(json!({ "message": "Layanan berhasil diupdate" })))
}

// ── DELETE /admin/services/:id ─────────────────────────────────────────

async fn delete_service(
    State(state): State<Arc<AppState>>,
    user: CurrentUser,
    Path(id): Path<i32>,
) -> AppResult<Json<serde_json::Value>> {
    if !is_admin(&user) {
        return Err(AppError::Forbidden);
    }

    let r = sqlx::query("DELETE FROM services WHERE id = ?")
        .bind(id).execute(&state.db).await?;

    if r.rows_affected() == 0 {
        return Err(AppError::NotFound("Layanan tidak ditemukan".into()));
    }

    Ok(Json(json!({ "message": "Layanan berhasil dihapus" })))
}

// ── POST /admin/services/sync ──────────────────────────────────────────

async fn sync_services(
    State(state): State<Arc<AppState>>,
    user: CurrentUser,
) -> AppResult<Json<serde_json::Value>> {
    if !is_admin(&user) {
        return Err(AppError::Forbidden);
    }

    let api_services = state.ceirid.fetch_service_list().await
        .map_err(|e| AppError::Internal(format!("Gagal fetch layanan CEIR: {}", e)))?;

    let flat = crate::services::ceirid_client::flatten_services(&api_services);

    if flat.is_empty() {
        return Err(AppError::BadRequest("Tidak ada layanan dari API".into()));
    }

    for svc in &flat {
        sqlx::query(
            "INSERT INTO services (service_id, service_name, group_name, buy_price, time_info, \
             min_qty, max_qty, custom_field_name, custom_field_regex, custom_field_maxlen, \
             allow_bulk, api_provider, api_service_id, api_type, last_synced_at) \
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ceir', ?, ?, NOW()) \
             ON DUPLICATE KEY UPDATE \
             service_name = VALUES(service_name), group_name = VALUES(group_name), \
             buy_price = VALUES(buy_price), time_info = VALUES(time_info), \
             min_qty = VALUES(min_qty), max_qty = VALUES(max_qty), \
             custom_field_name = VALUES(custom_field_name), custom_field_regex = VALUES(custom_field_regex), \
             custom_field_maxlen = VALUES(custom_field_maxlen), allow_bulk = VALUES(allow_bulk), \
             api_service_id = VALUES(api_service_id), api_type = VALUES(api_type), \
             last_synced_at = NOW()"
        )
        .bind(&svc.service_id).bind(&svc.service_name).bind(&svc.group_name)
        .bind(svc.buy_price).bind(&svc.time_info)
        .bind(svc.min_qty).bind(&svc.max_qty)
        .bind(&svc.custom_field_name).bind(&svc.custom_field_regex).bind(svc.custom_field_maxlen)
        .bind(svc.allow_bulk)
        .bind(&svc.service_id).bind(&svc.api_type)
        .execute(&state.db).await?;
    }

    let account = match state.ceirid.get_balance().await {
        Ok(b) => {
            let credit = b.get("data").and_then(|d| d.get("credit")).and_then(|v| v.as_f64())
                .or_else(|| b.get("credit").and_then(|v| v.as_f64()))
                .unwrap_or(0.0);
            Some(json!({ "credit": credit.to_string(), "currency": "IDR" }))
        }
        Err(_) => None,
    };

    let count = flat.len();
    Ok(Json(json!({
        "message": "Sinkronisasi berhasil",
        "summary": { "totalFromApi": count, "synced": count },
        "account": account,
    })))
}

// ── GET /admin/services/sync-status (FIXED: added auth) ───────────────

async fn sync_status(
    State(state): State<Arc<AppState>>,
    user: CurrentUser,
) -> AppResult<Json<serde_json::Value>> {
    if !is_admin(&user) {
        return Err(AppError::Forbidden);
    }

    let row: Option<(Option<chrono::NaiveDateTime>, i64)> = sqlx::query_as(
        "SELECT MAX(last_synced_at), COUNT(*) FROM services"
    ).fetch_optional(&state.db).await?;

    let (last_synced, total) = row.unwrap_or((None, 0));
    let (is_stale, minutes_ago) = match last_synced {
        Some(ls) => {
            let diff = chrono::Utc::now().naive_utc() - ls;
            let mins = diff.num_minutes();
            (diff.num_hours() >= 1 || total == 0, Some(mins))
        }
        None => (true, None),
    };

    Ok(Json(json!({
        "lastSynced": last_synced.map(|d| d.format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string()),
        "total": total,
        "isStale": is_stale,
        "minutesAgo": minutes_ago,
    })))
}

// ── PATCH /admin/services/batch (FIXED: added auth) ────────────────────

#[derive(Deserialize)]
struct BatchUpdateBody {
    ids: Vec<i32>,
    is_active: bool,
}

async fn batch_update_services(
    State(state): State<Arc<AppState>>,
    user: CurrentUser,
    Json(body): Json<BatchUpdateBody>,
) -> AppResult<Json<serde_json::Value>> {
    if !is_admin(&user) {
        return Err(AppError::Forbidden);
    }

    if body.ids.is_empty() {
        return Err(AppError::BadRequest("ids harus berupa array dan tidak boleh kosong".into()));
    }

    let placeholders = body.ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
    let sql = format!("UPDATE services SET is_active = ? WHERE id IN ({})", placeholders);
    let mut q = sqlx::query(&sql).bind(body.is_active);
    for id in &body.ids { q = q.bind(id); }
    let r = q.execute(&state.db).await?;

    Ok(Json(json!({ "ok": true, "affectedRows": r.rows_affected() })))
}

// ── DELETE /admin/services/batch (FIXED: added auth) ───────────────────

#[derive(Deserialize)]
struct BatchDeleteBody {
    ids: Vec<i32>,
}

async fn batch_delete_services(
    State(state): State<Arc<AppState>>,
    user: CurrentUser,
    Json(body): Json<BatchDeleteBody>,
) -> AppResult<Json<serde_json::Value>> {
    if !is_admin(&user) {
        return Err(AppError::Forbidden);
    }

    if body.ids.is_empty() {
        return Err(AppError::BadRequest("ids harus berupa array dan tidak boleh kosong".into()));
    }

    let placeholders = body.ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
    let sql = format!("DELETE FROM services WHERE id IN ({})", placeholders);
    let mut q = sqlx::query(&sql);
    for id in &body.ids { q = q.bind(id); }
    let r = q.execute(&state.db).await?;

    Ok(Json(json!({ "ok": true, "affectedRows": r.rows_affected() })))
}

// ── GET /admin/users ───────────────────────────────────────────────────

#[derive(Deserialize)]
struct UsersQuery {
    role: Option<String>,
    search: Option<String>,
}

async fn get_users(
    State(state): State<Arc<AppState>>,
    user: CurrentUser,
    Query(q): Query<UsersQuery>,
) -> AppResult<Json<serde_json::Value>> {
    if !is_admin(&user) {
        return Err(AppError::Forbidden);
    }

    let mut conditions = Vec::new();
    let mut params: Vec<String> = Vec::new();

    if let Some(ref r) = q.role {
        if r != "ALL" {
            conditions.push("role = ?".to_string());
            params.push(r.clone());
        }
    }
    if let Some(ref s) = q.search {
        if !s.is_empty() {
            conditions.push("(username LIKE ? OR email LIKE ?)".to_string());
            let pat = format!("%{}%", s);
            params.push(pat.clone());
            params.push(pat);
        }
    }

    let where_clause = if conditions.is_empty() { String::new() } else { format!("WHERE {}", conditions.join(" AND ")) };

    let sql = format!(
        "SELECT id, nama, username, email, no_hp, role, status, last_login_at, created_at, updated_at \
         FROM users {} ORDER BY FIELD(role, 'superadmin', 'admin', 'reseller', 'user'), created_at ASC", where_clause
    );

    let mut query = sqlx::query_as::<_, UserRow>(&sql);
    for p in &params { query = query.bind(p); }
    let rows: Vec<UserRow> = query.fetch_all(&state.db).await?;

    let total = rows.len();
    let users: Vec<serde_json::Value> = rows.iter().map(|r| json!({
        "id": r.id, "nama": r.nama, "username": r.username, "email": r.email,
        "no_hp": r.no_hp, "role": r.role, "status": r.status,
        "last_login_at": r.last_login_at.map(|d| d.format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string()),
        "created_at": r.created_at.format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string(),
        "updated_at": r.updated_at.format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string(),
    })).collect();

    Ok(Json(json!({ "users": users, "total": total })))
}

#[derive(sqlx::FromRow)]
struct UserRow {
    id: i32,
    nama: String,
    username: String,
    email: String,
    no_hp: String,
    role: String,
    status: String,
    last_login_at: Option<chrono::NaiveDateTime>,
    created_at: chrono::NaiveDateTime,
    updated_at: chrono::NaiveDateTime,
}

// ── POST /admin/users ──────────────────────────────────────────────────

#[derive(Deserialize)]
struct CreateUserBody {
    username: String,
    email: String,
    password: String,
    role: Option<String>,
    status: Option<String>,
    no_hp: Option<String>,
}

async fn create_user(
    State(state): State<Arc<AppState>>,
    caller: CurrentUser,
    Json(body): Json<CreateUserBody>,
) -> AppResult<Json<serde_json::Value>> {
    if !is_admin(&caller) {
        return Err(AppError::Forbidden);
    }

    if body.username.is_empty() || body.email.is_empty() || body.password.is_empty() {
        return Err(AppError::BadRequest("Username, email, dan password wajib diisi".into()));
    }
    if body.password.len() < 6 {
        return Err(AppError::BadRequest("Password minimal 6 karakter".into()));
    }

    let requested_role = body.role.as_deref().unwrap_or("user");
    if requested_role == "superadmin" {
        return Err(AppError::Forbidden);
    }
    if caller.role == UserRole::Admin && requested_role != "user" {
        return Err(AppError::BadRequest("Admin hanya dapat menambahkan pengguna dengan role user".into()));
    }

    let phone = body.no_hp.as_deref().unwrap_or("").to_string();
    let phone = if phone.is_empty() {
        format!("0{}", &chrono::Utc::now().timestamp_millis().to_string()[..11])
    } else {
        phone
    };

    // Check duplicates
    let dup: Option<(i32, String, String)> = sqlx::query_as(
        "SELECT id, email, username FROM users WHERE email = ? OR username = ? OR no_hp = ? LIMIT 1"
    ).bind(&body.email).bind(&body.username).bind(&phone).fetch_optional(&state.db).await?;

    if let Some((_, dup_email, dup_username)) = dup {
        if dup_email == body.email {
            return Err(AppError::Conflict("Email sudah terdaftar".into()));
        }
        if dup_username == body.username {
            return Err(AppError::Conflict("Username sudah terdaftar".into()));
        }
        return Err(AppError::Conflict("Nomor HP sudah terdaftar".into()));
    }

    let hashed = crate::middleware::auth::hash_password(&body.password)?;
    let user_status = body.status.as_deref().unwrap_or("active");

    sqlx::query(
        "INSERT INTO users (nama, username, email, no_hp, password, role, status, email_verified) \
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)"
    )
    .bind(&body.username).bind(&body.username).bind(&body.email)
    .bind(&phone).bind(&hashed).bind(requested_role).bind(user_status)
    .execute(&state.db).await
    .map_err(|e| {
        if e.to_string().contains("Duplicate") || e.to_string().contains("1062") {
            AppError::Conflict("Email, username, atau nomor HP sudah terdaftar".into())
        } else {
            AppError::Internal("Gagal menambahkan pengguna".into())
        }
    })?;

    Ok(Json(json!({
        "message": "Pengguna berhasil ditambahkan",
        "user": { "username": body.username, "email": body.email, "role": requested_role, "status": user_status },
    })))
}

// ── PATCH /admin/users/:id ─────────────────────────────────────────────

async fn update_user(
    State(state): State<Arc<AppState>>,
    caller: CurrentUser,
    Path(id): Path<i32>,
    Json(body): Json<serde_json::Value>,
) -> AppResult<Json<serde_json::Value>> {
    if !is_admin(&caller) {
        return Err(AppError::Forbidden);
    }

    let _is_superadmin = caller.role == UserRole::Superadmin;
    let is_admin_role = caller.role == UserRole::Admin;

    let target: Option<(i32, String)> = sqlx::query_as(
        "SELECT id, role FROM users WHERE id = ? LIMIT 1"
    ).bind(id).fetch_optional(&state.db).await?;

    let (_, target_role) = target.ok_or_else(|| AppError::NotFound("Pengguna tidak ditemukan".into()))?;

    if target_role == "superadmin" && caller.id != id {
        return Err(AppError::Forbidden);
    }

    let mut sets = Vec::new();
    let mut vals: Vec<String> = Vec::new();

    if let Some(role) = body.get("role").and_then(|v| v.as_str()) {
        let valid = ["user", "reseller", "admin"];
        if !valid.contains(&role) {
            return Err(AppError::BadRequest("Role tidak valid".into()));
        }
        if is_admin_role {
            return Err(AppError::BadRequest("Admin tidak memiliki izin untuk mengubah role".into()));
        }
        if role == "superadmin" {
            return Err(AppError::BadRequest("Tidak dapat menetapkan role superadmin".into()));
        }
        sets.push("role = ?".to_string());
        vals.push(role.to_string());
    }

    if let Some(status) = body.get("status").and_then(|v| v.as_str()) {
        let valid = ["active", "inactive"];
        if !valid.contains(&status) {
            return Err(AppError::BadRequest("Status tidak valid".into()));
        }
        if is_admin_role && target_role != "user" {
            return Err(AppError::BadRequest("Admin hanya dapat mengubah status pengguna biasa".into()));
        }
        sets.push("status = ?".to_string());
        vals.push(status.to_string());
    }

    if let Some(username) = body.get("username").and_then(|v| v.as_str()) {
        let dup: Option<(i32,)> = sqlx::query_as(
            "SELECT id FROM users WHERE username = ? AND id != ? LIMIT 1"
        ).bind(username).bind(id).fetch_optional(&state.db).await?;
        if dup.is_some() {
            return Err(AppError::Conflict("Username sudah digunakan".into()));
        }
        sets.push("username = ?".to_string());
        vals.push(username.to_string());
    }

    if let Some(email) = body.get("email").and_then(|v| v.as_str()) {
        let email_re = regex_lite::Regex::new(r"^[^\s@]+@[^\s@]+\.[^\s@]+$").unwrap();
        if !email_re.is_match(email) {
            return Err(AppError::BadRequest("Format email tidak valid".into()));
        }
        let dup: Option<(i32,)> = sqlx::query_as(
            "SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1"
        ).bind(email).bind(id).fetch_optional(&state.db).await?;
        if dup.is_some() {
            return Err(AppError::Conflict("Email sudah digunakan".into()));
        }
        sets.push("email = ?".to_string());
        vals.push(email.to_string());
    }

    if sets.is_empty() {
        return Err(AppError::BadRequest("Tidak ada field yang diupdate".into()));
    }

    let sql = format!("UPDATE users SET {} WHERE id = ?", sets.join(", "));
    let mut q = sqlx::query(&sql);
    for v in &vals { q = q.bind(v); }
    q = q.bind(id);
    q.execute(&state.db).await?;

    Ok(Json(json!({ "message": "Pengguna berhasil diupdate" })))
}

// ── DELETE /admin/users/:id ────────────────────────────────────────────

async fn delete_user(
    State(state): State<Arc<AppState>>,
    caller: CurrentUser,
    Path(id): Path<i32>,
) -> AppResult<Json<serde_json::Value>> {
    if caller.role != UserRole::Superadmin {
        return Err(AppError::BadRequest("Hanya superadmin yang dapat menghapus pengguna".into()));
    }

    let target: Option<(String,)> = sqlx::query_as(
        "SELECT role FROM users WHERE id = ? LIMIT 1"
    ).bind(id).fetch_optional(&state.db).await?;

    let (target_role,) = target.ok_or_else(|| AppError::NotFound("Pengguna tidak ditemukan".into()))?;

    if target_role == "superadmin" {
        return Err(AppError::BadRequest("Tidak dapat menghapus akun superadmin".into()));
    }

    sqlx::query("DELETE FROM users WHERE id = ?")
        .bind(id).execute(&state.db).await?;

    Ok(Json(json!({ "message": "Pengguna berhasil dihapus" })))
}

// ── GET /admin/transactions ────────────────────────────────────────────

async fn get_transactions(
    State(state): State<Arc<AppState>>,
    user: CurrentUser,
) -> AppResult<Json<serde_json::Value>> {
    if !is_admin(&user) {
        return Err(AppError::Forbidden);
    }

    let rows: Vec<TransactionRow> = sqlx::query_as(
        "SELECT p.payment_id, p.order_id, CAST(p.total_amount AS CHAR) as total_amount, p.payment_type, \
         p.confirmed_at, p.created_at, o.service_name, CAST(o.imei_list AS CHAR) as imei_list, CAST(s.buy_price AS CHAR) as buy_price \
         FROM payments p JOIN orders o ON o.order_id = p.order_id \
         JOIN services s ON s.service_id = o.service_id \
         WHERE p.status = 'LUNAS' \
         ORDER BY COALESCE(p.confirmed_at, p.created_at) DESC LIMIT 100"
    ).fetch_all(&state.db).await?;

    let mut transactions = Vec::new();
    let mut idx = 0u32;

    for r in &rows {
        idx += 1;
        let imei_count = r.imei_list.as_deref()
            .and_then(|s| serde_json::from_str::<Vec<String>>(s).ok())
            .map(|v| v.len())
            .unwrap_or(1);

        let payment_type = r.payment_type.as_deref().unwrap_or("QRIS");
        let date = r.confirmed_at.unwrap_or(r.created_at);
        let date_str = date.format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string();
        let total_amount: f64 = r.total_amount.parse().unwrap_or(0.0);
        let buy_price: f64 = r.buy_price.parse().unwrap_or(0.0);

        let imei_suffix = if imei_count > 1 { format!(" ({} IMEI)", imei_count) } else { String::new() };

        transactions.push(json!({
            "id": format!("TRX-{:03}", idx),
            "type": "IN",
            "description": format!("Pembayaran {} — {}{}", payment_type, r.service_name, imei_suffix),
            "relatedOrder": r.order_id,
            "amount": total_amount,
            "date": date_str,
        }));

        let seller_cost = buy_price * imei_count as f64;
        if seller_cost > 0.0 {
            idx += 1;
            let cost_suffix = if imei_count > 1 {
                format!(" ({} IMEI × {})", imei_count, buy_price as i64)
            } else { String::new() };
            transactions.push(json!({
                "id": format!("TRX-{:03}", idx),
                "type": "OUT",
                "description": format!("Setoran ke Seller — {}{}", r.service_name, cost_suffix),
                "relatedOrder": r.order_id,
                "amount": seller_cost,
                "date": date_str,
            }));
        }
    }

    let total_in: f64 = transactions.iter().filter(|t| t["type"] == "IN").map(|t| t["amount"].as_f64().unwrap_or(0.0)).sum();
    let total_out: f64 = transactions.iter().filter(|t| t["type"] == "OUT").map(|t| t["amount"].as_f64().unwrap_or(0.0)).sum();

    Ok(Json(json!({
        "transactions": transactions,
        "summary": { "totalIn": total_in, "totalOut": total_out, "profit": total_in - total_out },
    })))
}

#[derive(sqlx::FromRow)]
struct TransactionRow {
    payment_id: String,
    order_id: String,
    total_amount: String,
    payment_type: Option<String>,
    confirmed_at: Option<chrono::NaiveDateTime>,
    created_at: chrono::NaiveDateTime,
    service_name: String,
    imei_list: Option<String>,
    buy_price: String,
}

// ── GET /admin/info (reseller only) ────────────────────────────────────

async fn get_info(
    State(state): State<Arc<AppState>>,
    caller: CurrentUser,
) -> AppResult<Json<serde_json::Value>> {
    // Verify from DB — reseller only
    let row: Option<(String, String)> = sqlx::query_as(
        "SELECT role, status FROM users WHERE id = ? LIMIT 1"
    ).bind(caller.id).fetch_optional(&state.db).await?;

    let (role, status) = row.ok_or(AppError::Unauthorized)?;
    if status != "active" || role != "reseller" {
        return Err(AppError::Forbidden);
    }

    let (active_users,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM users WHERE status = 'active' AND role = 'user'"
    ).fetch_one(&state.db).await?;

    let ceir_balance: Option<f64> = match state.ceirid.get_balance().await {
        Ok(b) => b.get("data").and_then(|d| d.get("credit")).and_then(|v| v.as_f64())
            .or_else(|| b.get("credit").and_then(|v| v.as_f64())),
        Err(e) => { tracing::error!("getBalance failed: {}", e); None }
    };

    Ok(Json(json!({ "activeUsers": active_users, "ceirBalance": ceir_balance })))
}
