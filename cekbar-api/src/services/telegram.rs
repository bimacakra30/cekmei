use reqwest::Client;
use serde::Deserialize;
use serde_json::json;
use tracing;

#[derive(Clone)]
pub struct TelegramNotifier {
    client: Client,
    bot_token: String,
    chat_id: String,
}

#[derive(Deserialize, Debug)]
pub struct TelegramUpdate {
    pub callback_query: Option<CallbackQuery>,
}

#[derive(Deserialize, Debug)]
pub struct CallbackQuery {
    pub id: String,
    pub data: Option<String>,
    pub message: Option<CallbackMessage>,
}

#[derive(Deserialize, Debug)]
pub struct CallbackMessage {
    pub message_id: i64,
    pub chat: CallbackChat,
}

#[derive(Deserialize, Debug)]
pub struct CallbackChat {
    pub id: i64,
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

    pub async fn send_message_with_buttons(
        &self,
        text: &str,
        buttons: Vec<Vec<InlineButton>>,
    ) -> Result<(), String> {
        if !self.is_configured() {
            return Ok(());
        }

        let url = format!(
            "https://api.telegram.org/bot{}/sendMessage",
            self.bot_token
        );

        let keyboard: Vec<Vec<serde_json::Value>> = buttons
            .iter()
            .map(|row| {
                row.iter()
                    .map(|btn| {
                        json!({
                            "text": btn.text,
                            "callback_data": btn.callback_data
                        })
                    })
                    .collect()
            })
            .collect();

        let body = json!({
            "chat_id": self.chat_id,
            "text": text,
            "parse_mode": "HTML",
            "reply_markup": {
                "inline_keyboard": keyboard
            }
        });

        let res = self
            .client
            .post(&url)
            .json(&body)
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

    pub async fn edit_message(
        &self,
        chat_id: i64,
        message_id: i64,
        text: &str,
        buttons: Option<Vec<Vec<InlineButton>>>,
    ) -> Result<(), String> {
        if !self.is_configured() {
            return Ok(());
        }

        let url = format!(
            "https://api.telegram.org/bot{}/editMessageText",
            self.bot_token
        );

        let mut body = json!({
            "chat_id": chat_id,
            "message_id": message_id,
            "text": text,
            "parse_mode": "HTML"
        });

        if let Some(btns) = buttons {
            let keyboard: Vec<Vec<serde_json::Value>> = btns
                .iter()
                .map(|row| {
                    row.iter()
                        .map(|btn| {
                            json!({
                                "text": btn.text,
                                "callback_data": btn.callback_data
                            })
                        })
                        .collect()
                })
                .collect();

            body["reply_markup"] = json!({ "inline_keyboard": keyboard });
        }

        let res = self
            .client
            .post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Telegram edit failed: {}", e))?;

        if !res.status().is_success() {
            let status = res.status();
            let resp_body = res.text().await.unwrap_or_default();
            tracing::error!("Telegram edit error: {} - {}", status, resp_body);
        }

        Ok(())
    }

    pub async fn answer_callback(&self, callback_id: &str, text: &str) -> Result<(), String> {
        if !self.is_configured() {
            return Ok(());
        }

        let url = format!(
            "https://api.telegram.org/bot{}/answerCallbackQuery",
            self.bot_token
        );

        let _ = self
            .client
            .post(&url)
            .json(&json!({
                "callback_query_id": callback_id,
                "text": text
            }))
            .send()
            .await;

        Ok(())
    }

    pub async fn set_webhook(&self, webhook_url: &str) -> Result<(), String> {
        let url = format!(
            "https://api.telegram.org/bot{}/setWebhook",
            self.bot_token
        );

        let res = self
            .client
            .post(&url)
            .json(&json!({ "url": webhook_url }))
            .send()
            .await
            .map_err(|e| format!("Set webhook failed: {}", e))?;

        let body = res.text().await.unwrap_or_default();
        tracing::info!("Telegram setWebhook response: {}", body);
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
             ⏳ Status: <b>PENDING</b>",
            order_id, username, service_name, imei_display, format_price(total_price),
        );

        let buttons = vec![vec![
            InlineButton {
                text: "▶️ Mulai Proses".into(),
                callback_data: format!("process:{}", order_id),
            },
            InlineButton {
                text: "❌ Gagal".into(),
                callback_data: format!("fail:{}", order_id),
            },
        ]];

        if let Err(e) = self.send_message_with_buttons(&text, buttons).await {
            tracing::error!("Gagal kirim notif Telegram order {}: {}", order_id, e);
        }
    }
}

#[derive(Clone)]
pub struct InlineButton {
    pub text: String,
    pub callback_data: String,
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
