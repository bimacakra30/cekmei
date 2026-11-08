use serde::Serialize;
use sqlx::FromRow;
use chrono::NaiveDateTime;

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct SystemSetting {
    pub key_name: String,
    pub value: String,
    pub updated_at: NaiveDateTime,
}

