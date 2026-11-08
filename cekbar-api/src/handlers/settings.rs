use std::sync::Arc;
use axum::{Router, routing::get, Json, extract::State};
use serde::Deserialize;
use serde_json::json;
use std::collections::HashMap;

use crate::error::{AppError, AppResult};
use crate::middleware::auth::CurrentUser;
use crate::models::user::UserRole;
use crate::AppState;

const ALLOWED_KEYS: &[&str] = &["rate_limit", "max_imei_per_order"];

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(get_settings).post(upsert_settings))
        .route("/maintenance", get(maintenance_status).post(toggle_maintenance))
}

// GET /api/settings — admin only
async fn get_settings(
    State(state): State<Arc<AppState>>,
    user: CurrentUser,
) -> AppResult<Json<serde_json::Value>> {
    if user.role != UserRole::Admin && user.role != UserRole::Superadmin {
        return Err(AppError::Forbidden);
    }

    let rows: Vec<(String, String)> = sqlx::query_as(
        "SELECT key_name, value FROM system_settings WHERE key_name IN ('rate_limit', 'max_imei_per_order')"
    )
    .fetch_all(&state.db)
    .await?;

    let mut settings = HashMap::new();
    for (k, v) in rows {
        settings.insert(k, v);
    }

    Ok(Json(json!({ "settings": settings })))
}

#[derive(Deserialize)]
struct UpsertSettingsBody {
    settings: HashMap<String, serde_json::Value>,
}

// POST /api/settings — admin only
async fn upsert_settings(
    State(state): State<Arc<AppState>>,
    user: CurrentUser,
    Json(body): Json<UpsertSettingsBody>,
) -> AppResult<Json<serde_json::Value>> {
    if user.role != UserRole::Admin && user.role != UserRole::Superadmin {
        return Err(AppError::Forbidden);
    }

    let mut count = 0u32;
    for (key, value) in &body.settings {
        if !ALLOWED_KEYS.contains(&key.as_str()) {
            continue;
        }
        let val_str = match value {
            serde_json::Value::String(s) => s.clone(),
            other => other.to_string(),
        };
        sqlx::query(
            "INSERT INTO system_settings (key_name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)"
        )
        .bind(key)
        .bind(&val_str)
        .execute(&state.db)
        .await?;
        count += 1;
    }

    if count == 0 {
        return Err(AppError::BadRequest("Tidak ada setting yang valid".into()));
    }

    Ok(Json(json!({ "message": "Pengaturan berhasil disimpan", "updated": count })))
}

// GET /api/settings/maintenance — public
async fn maintenance_status(
    State(state): State<Arc<AppState>>,
) -> Json<serde_json::Value> {
    let row: Option<(String,)> = sqlx::query_as(
        "SELECT value FROM system_settings WHERE key_name = 'maintenance_mode' LIMIT 1"
    )
    .fetch_optional(&state.db)
    .await
    .unwrap_or(None);

    let enabled = row.map(|r| r.0 == "true").unwrap_or(false);
    Json(json!({ "enabled": enabled }))
}

#[derive(Deserialize)]
struct MaintenanceBody {
    enabled: bool,
}

// POST /api/settings/maintenance — admin only
async fn toggle_maintenance(
    State(state): State<Arc<AppState>>,
    user: CurrentUser,
    Json(body): Json<MaintenanceBody>,
) -> AppResult<Json<serde_json::Value>> {
    if user.role != UserRole::Admin && user.role != UserRole::Superadmin {
        return Err(AppError::Forbidden);
    }

    let val = if body.enabled { "true" } else { "false" };
    sqlx::query(
        "INSERT INTO system_settings (key_name, value) VALUES ('maintenance_mode', ?) ON DUPLICATE KEY UPDATE value = VALUES(value)"
    )
    .bind(val)
    .execute(&state.db)
    .await?;

    Ok(Json(json!({ "enabled": body.enabled })))
}
