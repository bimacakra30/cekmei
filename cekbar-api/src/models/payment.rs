use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::NaiveDateTime;
use rust_decimal::Decimal;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
pub enum PaymentStatus {
    MENUNGGU,
    LUNAS,
    KADALUARSA,
    GAGAL,
}

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct Payment {
    pub id: i32,
    pub payment_id: String,
    pub order_id: String,
    pub amount: Decimal,
    pub fee: Decimal,
    pub total_amount: Decimal,
    pub qris_id: Option<String>,
    pub trx_id: Option<String>,
    pub qr_image: Option<String>,
    pub qris_url: Option<String>,
    pub gopay_transaction_id: Option<String>,
    pub payer_issuer: Option<String>,
    pub payment_type: Option<String>,
    pub status: PaymentStatus,
    pub confirmed_at: Option<NaiveDateTime>,
    pub expires_at: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

