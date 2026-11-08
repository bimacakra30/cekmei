use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::NaiveDateTime;
use rust_decimal::Decimal;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
pub enum OrderStatus {
    PENDING_PAYMENT,
    PENDING,
    PROCESSING,
    SUCCESS,
    FAILED,
    EXPIRED,
}

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct Order {
    pub id: i32,
    pub order_id: String,
    pub user_id: i32,
    pub service_id: String,
    pub service_name: String,
    pub imei_list: serde_json::Value,
    pub total_price: Decimal,
    pub status: OrderStatus,
    pub dhru_order_id: Option<String>,
    pub ceir_order_id: Option<String>,
    pub roamer_months: Option<i8>,
    pub status_note: Option<String>,
    pub unit_price: Decimal,
    pub results: Option<serde_json::Value>,
    pub is_direct_order: bool,
    pub is_manual_order: bool,
    pub admin_note: Option<String>,
    pub processed_by: Option<i32>,
    pub processed_at: Option<NaiveDateTime>,
    pub completed_at: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}
