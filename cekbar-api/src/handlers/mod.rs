use std::sync::Arc;
use axum::Router;

mod auth;
mod orders;
mod payments;
mod webhooks;
mod services;
mod settings;
mod user;
mod admin;
pub mod cron;

use crate::AppState;

pub fn api_router() -> Router<Arc<AppState>> {
    Router::new()
        .nest("/auth", auth::router())
        .nest("/orders", orders::router())
        .nest("/payments", payments::router())
        .nest("/webhooks", webhooks::router())
        .nest("/services", services::router())
        .nest("/settings", settings::router())
        .nest("/user", user::router())
        .nest("/admin", admin::router())
}

