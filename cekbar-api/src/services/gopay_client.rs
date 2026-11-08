use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::config::AppConfig;
use crate::error::{AppError, AppResult};

pub struct GopayClient {
    client: Client,
    pub base_url: String,
    api_key: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QrisPaymentResponse {
    pub qris_id: String,
    pub trx_id: String,
    pub qr_image: Option<String>,
    pub qris_url: Option<String>,
    pub amount: Option<f64>,
    pub expires_at: Option<String>,
}

impl GopayClient {
    pub fn new(config: &AppConfig) -> Self {
        let client = Client::builder()
            .timeout(std::time::Duration::from_secs(15))
            .build()
            .expect("Failed to build HTTP client");

        Self {
            client,
            base_url: config.gopay_api_url.clone(),
            api_key: config.gopay_api_key.clone(),
        }
    }

    pub async fn create_qris_payment(
        &self,
        amount: f64,
        callback_url: &str,
        expires_in: u32,
    ) -> AppResult<QrisPaymentResponse> {
        if self.api_key.is_empty() {
            return Err(AppError::Internal("GOPAY_API_KEY belum dikonfigurasi".into()));
        }

        let body = json!({
            "amount": amount,
            "callback_url": callback_url,
            "expires_in": expires_in,
        });

        let res = self.client
            .post(format!("{}/create-qris", self.base_url))
            .header("Content-Type", "application/json")
            .header("X-API-Key", &self.api_key)
            .json(&body)
            .send()
            .await?;

        if !res.status().is_success() {
            let status = res.status();
            let err_body = res.text().await.unwrap_or_default();
            return Err(AppError::Internal(format!("GoPay QRIS error: {} {}", status, err_body)));
        }

        let data: serde_json::Value = res.json().await?;

        if !data.get("success").and_then(|v| v.as_bool()).unwrap_or(false) {
            let msg = data.get("message").and_then(|v| v.as_str()).unwrap_or("Unknown error");
            return Err(AppError::Internal(format!("GoPay QRIS error: {}", msg)));
        }

        let d = data.get("data").ok_or_else(|| AppError::Internal("No data in response".into()))?;

        Ok(QrisPaymentResponse {
            qris_id: d.get("qris_id").and_then(|v| v.as_str()).unwrap_or("").to_string(),
            trx_id: d.get("trx_id").and_then(|v| v.as_str()).unwrap_or("").to_string(),
            qr_image: d.get("qr_image").and_then(|v| v.as_str()).map(|s| s.to_string()),
            qris_url: d.get("qris_url").and_then(|v| v.as_str()).map(|s| s.to_string()),
            amount: d.get("amount").and_then(|v| v.as_f64()),
            expires_at: d.get("expires_at").and_then(|v| v.as_str()).map(|s| s.to_string()),
        })
    }

    pub async fn check_payment(&self, amount: f64, trx_id: &str) -> AppResult<serde_json::Value> {
        let body = json!({
            "amount": amount.round() as i64,
            "trx_id": trx_id,
        });

        let res = self.client
            .post(format!("{}/check-payment", self.base_url))
            .header("Content-Type", "application/json")
            .header("X-API-Key", &self.api_key)
            .json(&body)
            .send()
            .await?;

        let data: serde_json::Value = res.json().await?;
        Ok(data)
    }

    pub async fn check_qr_status(&self, qris_id: &str) -> AppResult<serde_json::Value> {
        let res = self.client
            .get(format!("{}/api/qr-status/{}", self.base_url, qris_id))
            .send()
            .await?;

        if !res.status().is_success() {
            return Ok(json!({"paid": false, "status": "NOT_FOUND", "message": "QRIS tidak ditemukan"}));
        }

        let data: serde_json::Value = res.json().await?;
        Ok(data)
    }

    pub fn verify_webhook_signature(&self, body: &[u8], signature: &str) -> bool {
        crate::utils::crypto::verify_hmac_sha256(self.api_key.as_bytes(), body, signature)
    }
}
