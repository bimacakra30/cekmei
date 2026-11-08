use std::sync::Arc;
use axum::{
    extract::{Request, State},
    middleware::Next,
    response::Response,
};

use crate::AppState;
use crate::error::AppError;
use crate::middleware::auth::CurrentUser;
use crate::models::user::UserRole;

pub async fn maintenance_middleware(
    State(state): State<Arc<AppState>>,
    req: Request,
    next: Next,
) -> Result<Response, AppError> {
    let is_maintenance: Option<(String,)> = sqlx::query_as(
        "SELECT value FROM system_settings WHERE key_name = 'maintenance_mode'"
    )
    .fetch_optional(&state.db)
    .await?;

    if let Some((value,)) = is_maintenance {
        if value == "true" {
            // Allow admin/superadmin through
            if let Some(user) = req.extensions().get::<CurrentUser>() {
                if user.role == UserRole::Admin || user.role == UserRole::Superadmin {
                    return Ok(next.run(req).await);
                }
            }
            return Err(AppError::BadRequest("System sedang dalam maintenance".into()));
        }
    }

    Ok(next.run(req).await)
}

