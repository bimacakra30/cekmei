#[derive(Clone)]
pub struct AppConfig {
    pub database_url: String,
    pub app_url: String,
    pub session_secret: String,
    pub jwt_secret: String,

    // CEIRID
    pub ceirid_api_url: String,
    pub ceirid_api_key: String,
    pub ceirid_webhook_secret: String,

    // GoPay
    pub gopay_api_url: String,
    pub gopay_api_key: String,

    // SMTP
    pub smtp_host: String,
    pub smtp_port: u16,
    pub smtp_user: String,
    pub smtp_pass: String,
    pub smtp_from: String,

    // Cron
    pub cron_secret: Option<String>,
}

impl AppConfig {
    pub fn from_env() -> Self {
        Self {
            database_url: env_required("DATABASE_URL"),
            app_url: env_required("APP_URL"),
            session_secret: env_required("SESSION_SECRET"),
            jwt_secret: env_or("JWT_SECRET", &env_required("SESSION_SECRET")),

            ceirid_api_url: env_required("CEIRID_API_URL"),
            ceirid_api_key: env_required("CEIRID_API_KEY"),
            ceirid_webhook_secret: env_required("CEIRID_WEBHOOK_SECRET"),

            gopay_api_url: env_required("GOPAY_API_URL"),
            gopay_api_key: env_required("GOPAY_API_KEY"),

            smtp_host: env_or("SMTP_HOST", "smtp.gmail.com"),
            smtp_port: env_or("SMTP_PORT", "587").parse().expect("SMTP_PORT must be a number"),
            smtp_user: env_required("SMTP_USER"),
            smtp_pass: env_required("SMTP_PASS"),
            smtp_from: env_required("SMTP_FROM"),

            cron_secret: std::env::var("CRON_SECRET").ok(),
        }
    }
}

fn env_required(key: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| panic!("{key} must be set"))
}

fn env_or(key: &str, default: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| default.to_string())
}

