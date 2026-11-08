use serde::Serialize;
use sqlx::FromRow;
use chrono::NaiveDateTime;
use rust_decimal::Decimal;

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct Service {
    pub id: i32,
    pub service_id: String,
    pub service_name: String,
    pub group_name: String,
    pub category: Option<String>,
    pub api_provider: String,
    pub api_service_id: Option<String>,
    pub api_type: Option<String>,
    pub buy_price: Decimal,
    pub sell_price: Decimal,
    pub time_info: String,
    pub info: Option<String>,
    pub min_qty: i32,
    pub max_qty: String,
    pub custom_field_name: String,
    pub custom_field_regex: String,
    pub custom_field_maxlen: String,
    pub allow_bulk: bool,
    pub is_active: bool,
    pub last_synced_at: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}
