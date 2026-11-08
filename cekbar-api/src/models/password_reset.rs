use serde::Serialize;
use sqlx::FromRow;
use chrono::NaiveDateTime;

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct PasswordReset {
    pub id: i32,
    pub email: String,
    pub token: String,
    pub used: bool,
    pub expires_at: NaiveDateTime,
    pub created_at: NaiveDateTime,
}

