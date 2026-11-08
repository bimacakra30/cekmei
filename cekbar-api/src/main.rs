use std::sync::Arc;
use std::time::Duration;

use axum::{middleware as axum_mw, Router};
use sqlx::mysql::MySqlPoolOptions;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::EnvFilter;

mod config;
mod db;
mod error;
mod handlers;
mod middleware;
mod models;
mod services;
mod utils;

use config::AppConfig;
use middleware::rate_limit::RateLimiter;
use services::ceirid_client::CeiridClient;
use services::gopay_client::GopayClient;
use services::mailer::Mailer;

pub struct AppState {
    pub db: sqlx::MySqlPool,
    pub config: AppConfig,
    pub mailer: Mailer,
    pub ceirid: CeiridClient,
    pub gopay: GopayClient,

    // Rate limiters
    pub login_limiter: RateLimiter,
    pub register_limiter: RateLimiter,
    pub verify_limiter: RateLimiter,
    pub forgot_limiter: RateLimiter,
}

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .init();

    let config = AppConfig::from_env();

    let pool = MySqlPoolOptions::new()
        .max_connections(10)
        .connect(&config.database_url)
        .await
        .expect("Failed to connect to database");

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    tracing::info!("Database connected and migrations applied");

    let mailer = Mailer::new(&config);
    let ceirid = CeiridClient::new(&config);
    let gopay = GopayClient::new(&config);

    let state = Arc::new(AppState {
        db: pool.clone(),
        mailer,
        ceirid,
        gopay,

        // 100 per 15 min (relaxed for dev/testing)
        login_limiter: RateLimiter::new(100, Duration::from_secs(15 * 60)),
        // 5 per hour
        register_limiter: RateLimiter::new(5, Duration::from_secs(60 * 60)),
        // 5 per 15 min
        verify_limiter: RateLimiter::new(5, Duration::from_secs(15 * 60)),
        // 2 per 5 min
        forgot_limiter: RateLimiter::new(2, Duration::from_secs(5 * 60)),

        config,
    });

    // Spawn background cron tasks
    handlers::cron::spawn_cron_tasks(state.clone());

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any)
        .allow_credentials(false);

    let app = Router::new()
        .nest("/api", handlers::api_router())
        .layer(axum_mw::from_fn_with_state(state.clone(), middleware::auth::auth_middleware))
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .with_state(state);

    let addr = "0.0.0.0:8080";
    tracing::info!("Listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
