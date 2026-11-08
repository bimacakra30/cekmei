use std::sync::Arc;
use std::time::Duration;
use crate::AppState;

pub fn spawn_cron_tasks(state: Arc<AppState>) {
    // Expire payments: every 2 minutes
    let s = state.clone();
    tokio::spawn(async move {
        tokio::time::sleep(Duration::from_secs(30)).await;
        let mut interval = tokio::time::interval(Duration::from_secs(120));
        loop {
            interval.tick().await;
            if let Err(e) = expire_payments(&s).await {
                tracing::error!("Cron expire_payments error: {}", e);
            }
        }
    });

    // Process pending orders: every 5 minutes
    let s = state.clone();
    tokio::spawn(async move {
        tokio::time::sleep(Duration::from_secs(60)).await;
        let mut interval = tokio::time::interval(Duration::from_secs(300));
        loop {
            interval.tick().await;
            if let Err(e) = process_pending(&s).await {
                tracing::error!("Cron process_pending error: {}", e);
            }
        }
    });

    tracing::info!("Cron tasks spawned: expire_payments (2min), process_pending (5min)");
}

async fn expire_payments(state: &Arc<AppState>) -> Result<(), sqlx::Error> {
    let pay_result = sqlx::query(
        "UPDATE payments SET status = 'KADALUARSA' \
         WHERE status = 'MENUNGGU' AND expires_at IS NOT NULL AND expires_at < UTC_TIMESTAMP()"
    )
    .execute(&state.db)
    .await?;

    if pay_result.rows_affected() > 0 {
        let ord_result = sqlx::query(
            "UPDATE orders SET status = 'EXPIRED', status_note = 'Pembayaran kedaluwarsa' \
             WHERE status = 'PENDING_PAYMENT' \
             AND order_id IN (SELECT order_id FROM payments WHERE status = 'KADALUARSA')"
        )
        .execute(&state.db)
        .await?;

        tracing::info!(
            "Cron: expired {} payments, {} orders",
            pay_result.rows_affected(),
            ord_result.rows_affected()
        );
    }

    Ok(())
}

async fn process_pending(state: &Arc<AppState>) -> Result<(), String> {
    let rows: Vec<(String,)> = sqlx::query_as(
        "SELECT order_id FROM orders \
         WHERE status = 'PENDING' AND is_manual_order = 0 \
         AND updated_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 5 MINUTE) \
         LIMIT 10"
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| e.to_string())?;

    if rows.is_empty() {
        return Ok(());
    }

    tracing::info!("Cron: retrying {} stuck pending orders", rows.len());

    for (order_id,) in &rows {
        tracing::info!("Re-processing pending order: {}", order_id);
        match crate::services::order_processor::process_order_after_payment(state, order_id).await {
            Ok(_) => tracing::info!("Re-processed order {} OK", order_id),
            Err(e) => {
                tracing::error!("Re-process order {} failed: {}", order_id, e);
                let msg = format!("Retry gagal: {}", e);
                let _ = sqlx::query(
                    "UPDATE orders SET status = 'FAILED', status_note = ? WHERE order_id = ? AND status = 'PENDING'"
                )
                .bind(&msg[..msg.len().min(255)])
                .bind(order_id)
                .execute(&state.db)
                .await;
            }
        }
    }

    Ok(())
}
