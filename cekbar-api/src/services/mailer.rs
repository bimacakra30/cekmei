use lettre::{
    transport::smtp::authentication::Credentials,
    AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor,
};

use crate::config::AppConfig;
use crate::error::{AppError, AppResult};

pub struct Mailer {
    transport: AsyncSmtpTransport<Tokio1Executor>,
    from: String,
}

impl Mailer {
    pub fn new(config: &AppConfig) -> Self {
        let creds = Credentials::new(
            config.smtp_user.clone(),
            config.smtp_pass.clone(),
        );

        let transport = AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(&config.smtp_host)
            .expect("Failed to create SMTP transport")
            .credentials(creds)
            .port(config.smtp_port)
            .build();

        Self {
            transport,
            from: config.smtp_from.clone(),
        }
    }

    pub async fn send_otp_email(&self, to: &str, otp: &str) -> AppResult<()> {
        let html = format!(
            r#"<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
            <h2>Verifikasi Email</h2>
            <p>Kode OTP Anda:</p>
            <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;
                        padding:16px;background:#f0f0f0;border-radius:8px;margin:16px 0">
                {otp}
            </div>
            <p>Kode berlaku 15 menit.</p>
            </div>"#
        );

        self.send(to, "Verifikasi Email - Cekbar", &html).await
    }

    pub async fn send_reset_email(&self, to: &str, token: &str, base_url: &str) -> AppResult<()> {
        let link = format!("{}/reset-password?token={}", base_url, token);
        let html = format!(
            r#"<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
            <h2>Reset Password</h2>
            <p>Klik tombol di bawah untuk reset password:</p>
            <a href="{link}" style="display:inline-block;padding:12px 24px;background:#2563eb;
               color:white;text-decoration:none;border-radius:8px;margin:16px 0">
               Reset Password
            </a>
            <p>Link berlaku 1 jam.</p>
            </div>"#
        );

        self.send(to, "Reset Password - Cekbar", &html).await
    }

    async fn send(&self, to: &str, subject: &str, html: &str) -> AppResult<()> {
        let email = Message::builder()
            .from(self.from.parse().map_err(|e| AppError::Internal(format!("Invalid from: {e}")))?)
            .to(to.parse().map_err(|e| AppError::Internal(format!("Invalid to: {e}")))?)
            .subject(subject)
            .header(lettre::message::header::ContentType::TEXT_HTML)
            .body(html.to_string())
            .map_err(|e| AppError::Internal(format!("Failed to build email: {e}")))?;

        self.transport
            .send(email)
            .await
            .map_err(|e| AppError::Internal(format!("Failed to send email: {e}")))?;

        Ok(())
    }
}

