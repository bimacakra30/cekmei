use reqwest::Client;
use tracing;

#[derive(Clone)]
pub struct TelegramNotifier {
    client: Client,
    bot_token: String,
    chat_id: String,
}

impl TelegramNotifier {
    pub fn new(bot_token: &str, chat_id: &str) -> Self {
        Self {
            client: Client::new(),
            bot_token: bot_token.to_string(),
            chat_id: chat_id.to_string(),
        }
    }

    pub fn is_configured(&self) -> bool {
        !self.bot_token.is_empty() && !self.chat_id.is_empty()
    }

    pub async fn send_message(&self, text: &str) -> Result<(), String> {
        if !self.is_configured() {
            return Ok(());
        }

        let url = format!(
            "https://api.telegram.org/bot{}/sendMessage",
            self.bot_token
        );

        let res = self
            .client
            .post(&url)
            .json(&serde_json::json!({
                "chat_id": self.chat_id,
                "text": text,
                "parse_mode": "HTML"
            }))
            .send()
            .await
            .map_err(|e| format!("Telegram request failed: {}", e))?;

        if !res.status().is_success() {
            let status = res.status();
            let body = res.text().await.unwrap_or_default();
            tracing::error!("Telegram API error: {} - {}", status, body);
            return Err(format!("Telegram API error: {}", status));
        }

        Ok(())
    }

    pub async fn notify_manual_order(
        &self,
        order_id: &str,
        username: &str,
        service_name: &str,
        imei_list: &[String],
        total_price: f64,
    ) {
        if !self.is_configured() {
            return;
        }

        let imei_display = if imei_list.len() <= 3 {
            imei_list.join(", ")
        } else {
            format!(
                "{}, ... (+{} lagi)",
                imei_list[..3].join(", "),
                imei_list.len() - 3
            )
        };

        let text = format!(
            "🔔 <b>Order Manual Baru</b>\n\n\
             📋 Order ID: <code>{}</code>\n\
             👤 User: <b>{}</b>\n\
             🛠 Layanan: {}\n\
             📱 IMEI: <code>{}</code>\n\
             💰 Total: Rp {}\n\n\
             ⏳ Menunggu diproses admin",
            order_id,
            username,
            service_name,
            imei_display,
            format_price(total_price),
        );

        if let Err(e) = self.send_message(&text).await {
            tracing::error!("Gagal kirim notif Telegram order {}: {}", order_id, e);
        }
    }
}

fn format_price(price: f64) -> String {
    let rounded = price as i64;
    let s = rounded.to_string();
    let mut result = String::new();
    for (i, c) in s.chars().rev().enumerate() {
        if i > 0 && i % 3 == 0 {
            result.push('.');
        }
        result.push(c);
    }
    result.chars().rev().collect()
}

