use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::NaiveDateTime;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(rename_all = "lowercase")]
pub enum UserRole {
    #[serde(rename = "user")]
    User,
    #[serde(rename = "reseller")]
    Reseller,
    #[serde(rename = "admin")]
    Admin,
    #[serde(rename = "superadmin")]
    Superadmin,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(rename_all = "lowercase")]
pub enum UserStatus {
    #[serde(rename = "active")]
    Active,
    #[serde(rename = "inactive")]
    Inactive,
}

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct User {
    pub id: i32,
    pub nama: String,
    pub username: String,
    pub email: String,
    pub no_hp: String,
    #[serde(skip_serializing)]
    pub password: String,
    pub role: UserRole,
    pub status: UserStatus,
    pub email_verified: bool,
    pub last_login_at: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

