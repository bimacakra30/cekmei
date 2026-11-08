use std::sync::Arc;

use crate::error::{AppError, AppResult};
use crate::AppState;

pub async fn process_order_after_payment(
    state: &Arc<AppState>,
    order_id: &str,
) -> AppResult<()> {
    let order: Option<OrderRow> = sqlx::query_as(
        "SELECT order_id, service_id, service_name, CAST(imei_list AS CHAR) as imei_list, status FROM orders WHERE order_id = ?"
    )
    .bind(order_id)
    .fetch_optional(&state.db)
    .await?;

    let order = match order {
        Some(o) => o,
        None => {
            tracing::error!("[ProcessOrder] Order {} not found", order_id);
            return Ok(());
        }
    };

    if order.status != "PENDING" {
        tracing::info!("[ProcessOrder] Order {}: status={}, not PENDING — skip", order_id, order.status);
        return Ok(());
    }

    let service: Option<ServiceInfo> = sqlx::query_as(
        "SELECT api_provider, api_service_id, api_type FROM services WHERE service_id = ? LIMIT 1"
    )
    .bind(&order.service_id)
    .fetch_optional(&state.db)
    .await?;

    let (api_provider, api_service_id, api_type) = match service {
        Some(s) => (s.api_provider, s.api_service_id.unwrap_or_default(), s.api_type.unwrap_or_default()),
        None => (String::new(), String::new(), String::new()),
    };

    // Manual order
    if api_provider == "manual" {
        sqlx::query(
            "UPDATE orders SET status = 'PENDING', is_manual_order = true, status_note = 'Menunggu diproses oleh admin' WHERE order_id = ?"
        )
        .bind(order_id)
        .execute(&state.db)
        .await?;
        tracing::info!("[ProcessOrder] Order {}: manual order, queued for admin", order_id);

        // Telegram notification
        let user_info: Option<(String,)> = sqlx::query_as(
            "SELECT u.username FROM orders o JOIN users u ON u.id = o.user_id WHERE o.order_id = ? LIMIT 1"
        )
        .bind(order_id)
        .fetch_optional(&state.db)
        .await
        .unwrap_or(None);

        let username = user_info.map(|u| u.0).unwrap_or_else(|| "Unknown".into());
        let imei_list: Vec<String> = serde_json::from_str(&order.imei_list).unwrap_or_default();

        let total_price: f64 = sqlx::query_as::<_, (String,)>(
            "SELECT CAST(total_price AS CHAR) FROM orders WHERE order_id = ?"
        )
        .bind(order_id)
        .fetch_optional(&state.db)
        .await
        .unwrap_or(None)
        .map(|r| r.0.parse().unwrap_or(0.0))
        .unwrap_or(0.0);

        let tg = state.telegram.clone();
        let oid = order_id.to_string();
        let sname = order.service_name.clone();
        tokio::spawn(async move {
            tg.notify_manual_order(&oid, &username, &sname, &imei_list, total_price).await;
        });

        return Ok(());
    }

    if api_provider != "ceir" || api_service_id.is_empty() {
        tracing::info!("[ProcessOrder] Order {}: provider={}, not ceir — skip", order_id, api_provider);
        return Ok(());
    }

    let imei_list: Vec<String> = serde_json::from_str(&order.imei_list).unwrap_or_default();

    // CEIR check
    if api_type == "ceir" {
        tracing::info!("[ProcessOrder] Order {}: CEIR check, service_id={}, {} IMEIs", order_id, api_service_id, imei_list.len());

        sqlx::query("UPDATE orders SET status = 'PROCESSING' WHERE order_id = ?")
            .bind(order_id)
            .execute(&state.db)
            .await?;

        match state.ceirid.create_order(&api_service_id, &imei_list).await {
            Ok(result) => {
                let ceir_order_id = result.get("order_id").and_then(|v| v.as_str()).unwrap_or("");
                sqlx::query(
                    "UPDATE orders SET status = 'SUCCESS', ceir_order_id = ?, results = ?, completed_at = NOW() WHERE order_id = ?"
                )
                .bind(ceir_order_id)
                .bind(serde_json::to_string(&result).unwrap_or_default())
                .bind(order_id)
                .execute(&state.db)
                .await?;
                tracing::info!("[ProcessOrder] Order {}: CEIR success, ceir_order_id={}", order_id, ceir_order_id);
            }
            Err(e) => {
                let msg = format!("Gagal: {}", e);
                sqlx::query("UPDATE orders SET status = 'FAILED', status_note = ?, results = ? WHERE order_id = ?")
                    .bind(&msg[..msg.len().min(255)])
                    .bind(json_err(&e.to_string()))
                    .bind(order_id)
                    .execute(&state.db)
                    .await?;
                return Err(e);
            }
        }
        return Ok(());
    }

    // Roamer
    if api_type == "roamer" {
        let imei = imei_list.first().cloned().unwrap_or_default();
        tracing::info!("[ProcessOrder] Order {}: Roamer, service_id={}, IMEI={}", order_id, api_service_id, imei);

        sqlx::query("UPDATE orders SET status = 'PROCESSING' WHERE order_id = ?")
            .bind(order_id)
            .execute(&state.db)
            .await?;

        // Fetch service list to get months/cost
        let service_list = state.ceirid.fetch_service_list().await?;
        let target_id: i64 = api_service_id.parse().unwrap_or(0);

        let roamer_service = service_list.as_array()
            .and_then(|arr| arr.iter().find(|s| s.get("service_id").and_then(|v| v.as_i64()) == Some(target_id)));

        let (months, cost) = match roamer_service {
            Some(s) => (
                s.get("months").and_then(|v| v.as_i64()).unwrap_or(0) as i32,
                s.get("cost").and_then(|v| v.as_f64()).unwrap_or(0.0),
            ),
            None => {
                sqlx::query("UPDATE orders SET status = 'FAILED', status_note = 'Layanan Roamer sedang tidak tersedia di provider' WHERE order_id = ?")
                    .bind(order_id)
                    .execute(&state.db)
                    .await?;
                return Err(AppError::Internal("Roamer service not found".into()));
            }
        };

        match state.ceirid.add_roamer(&imei, months).await {
            Ok(result) => {
                let ceir_order_id = result.get("order_id").and_then(|v| v.as_str()).unwrap_or("").to_string();
                let status_note = result.get("status_note").and_then(|v| v.as_str()).unwrap_or("-");
                let note = if status_note == "-" { "Menunggu proses..." } else { status_note };

                sqlx::query(
                    "UPDATE orders SET ceir_order_id = ?, roamer_months = ?, unit_price = ?, status = 'PENDING', status_note = ? WHERE order_id = ?"
                )
                .bind(&ceir_order_id)
                .bind(months)
                .bind(cost)
                .bind(note)
                .bind(order_id)
                .execute(&state.db)
                .await?;

                tracing::info!("[ProcessOrder] Order {}: Roamer submitted, ceir_order_id={}", order_id, ceir_order_id);
            }
            Err(e) => {
                let msg = format!("Gagal: {}", e);
                sqlx::query("UPDATE orders SET status = 'FAILED', status_note = ? WHERE order_id = ?")
                    .bind(&msg[..msg.len().min(255)])
                    .bind(order_id)
                    .execute(&state.db)
                    .await?;
                return Err(e);
            }
        }
        return Ok(());
    }

    tracing::info!("[ProcessOrder] Order {}: CEIR api_type={} not recognized — skip", order_id, api_type);
    Ok(())
}

fn json_err(msg: &str) -> String {
    serde_json::json!({"error": msg}).to_string()
}

#[derive(sqlx::FromRow)]
struct OrderRow {
    order_id: String,
    service_id: String,
    service_name: String,
    imei_list: String,
    status: String,
}

#[derive(sqlx::FromRow)]
struct ServiceInfo {
    api_provider: String,
    api_service_id: Option<String>,
    api_type: Option<String>,
}
