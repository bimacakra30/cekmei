use std::time::Duration;
use reqwest::Client;
use serde_json::json;

use crate::config::AppConfig;
use crate::error::{AppError, AppResult};

pub struct CeiridClient {
    client: Client,
    base_url: String,
    api_key: String,
}

impl CeiridClient {
    pub fn new(config: &AppConfig) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .expect("Failed to build HTTP client");

        Self {
            client,
            base_url: config.ceirid_api_url.clone(),
            api_key: config.ceirid_api_key.clone(),
        }
    }

    async fn fetch(&self, method: &str, path: &str, body: Option<serde_json::Value>) -> AppResult<serde_json::Value> {
        let url = format!("{}{}", self.base_url, path);

        let mut req = match method {
            "POST" => self.client.post(&url),
            _ => self.client.get(&url),
        };

        req = req
            .header("Content-Type", "application/json")
            .header("X-API-Key", &self.api_key);

        if let Some(b) = body {
            req = req.json(&b);
        }

        let res = req.send().await?;

        if !res.status().is_success() {
            let status = res.status();
            let err_text = res.text().await.unwrap_or_default();
            return Err(AppError::Internal(format!("CEIRID API error: {} {}", status, err_text)));
        }

        let data: serde_json::Value = res.json().await?;
        Ok(data)
    }

    pub async fn validate_api_key(&self) -> AppResult<serde_json::Value> {
        self.fetch("POST", "/auth", None).await
    }

    pub async fn get_balance(&self) -> AppResult<serde_json::Value> {
        self.fetch("POST", "/balance", None).await
    }

    pub async fn fetch_service_list(&self) -> AppResult<serde_json::Value> {
        self.fetch("POST", "/services", None).await
    }

    pub async fn create_order(&self, service_id: &str, imeis: &[String]) -> AppResult<serde_json::Value> {
        let body = json!({
            "service_id": service_id.parse::<i64>().unwrap_or(0),
            "imeis": imeis,
        });
        self.fetch("POST", "/order", Some(body)).await
    }

    pub async fn get_order_status(&self, order_id: &str) -> AppResult<serde_json::Value> {
        self.fetch("GET", &format!("/status?order_id={}", order_id), None).await
    }

    pub async fn add_roamer(&self, imei: &str, months: i32) -> AppResult<serde_json::Value> {
        let body = json!({
            "imei": imei,
            "months": months,
        });
        self.fetch("POST", "/roamer/add", Some(body)).await
    }

    pub async fn get_roamer_status(&self, order_id: &str) -> AppResult<serde_json::Value> {
        self.fetch("GET", &format!("/roamer/status?order_id={}", order_id), None).await
    }
}

// Flat service struct for sync
pub struct FlatService {
    pub service_id: String,
    pub service_name: String,
    pub group_name: String,
    pub buy_price: f64,
    pub time_info: String,
    pub min_qty: Option<i32>,
    pub max_qty: Option<String>,
    pub custom_field_name: Option<String>,
    pub custom_field_regex: Option<String>,
    pub custom_field_maxlen: Option<i32>,
    pub allow_bulk: Option<bool>,
    pub api_type: String,
}

pub fn flatten_services(data: &serde_json::Value) -> Vec<FlatService> {
    let mut result = Vec::new();

    // CEIR API returns { success: true, data: [...services] }
    // Each service: { service_id, name, cost, type: "ceir"|"roamer", months?, process_time? }
    let services = match data.get("data").and_then(|d| d.as_array()) {
        Some(arr) => arr,
        None => match data.as_array() {
            Some(arr) => arr,
            None => return result,
        },
    };

    for svc in services {
        let service_id = svc.get("service_id")
            .and_then(|v| v.as_i64())
            .map(|v| v.to_string())
            .unwrap_or_default();

        let service_name = svc.get("name")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        let buy_price = svc.get("cost")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0);

        let api_type = svc.get("type")
            .and_then(|v| v.as_str())
            .unwrap_or("ceir")
            .to_string();

        let is_roamer = api_type == "roamer";

        let group_name = if is_roamer { "Unblock IMEI" } else { "CEIR Services" }.to_string();

        let time_info = if is_roamer {
            svc.get("process_time")
                .and_then(|v| v.as_str())
                .unwrap_or("Proses manual")
                .to_string()
        } else {
            "Instan".to_string()
        };

        if !service_id.is_empty() {
            result.push(FlatService {
                service_id,
                service_name,
                group_name,
                buy_price,
                time_info,
                min_qty: Some(1),
                max_qty: Some(if is_roamer { "5" } else { "10" }.to_string()),
                custom_field_name: Some("IMEI".to_string()),
                custom_field_regex: Some(r"^\d{15}$".to_string()),
                custom_field_maxlen: Some(15),
                allow_bulk: Some(!is_roamer),
                api_type,
            });
        }
    }

    result
}
