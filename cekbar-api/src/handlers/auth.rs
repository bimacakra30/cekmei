use std::sync::Arc;
use axum::{
    Router, Json,
    extract::State,
    http::header,
    response::{IntoResponse, Response},
    routing::{get, post},
    Extension,
};
use axum_extra::extract::cookie::{Cookie, SameSite};
use chrono::{NaiveDateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::AppState;
use crate::error::{AppError, AppResult};
use crate::middleware::auth::{create_token, CurrentUser, Claims};
use crate::middleware::rate_limit::RateLimiter;
use crate::models::user::{UserRole, UserStatus};
use crate::utils::crypto::{generate_otp, generate_token};

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/login", post(login))
        .route("/register", post(register))
        .route("/logout", post(logout))
        .route("/me", get(me))
        .route("/verify-email", post(verify_email))
        .route("/resend-otp", post(resend_otp))
        .route("/forgot-password", post(forgot_password))
        .route("/reset-password", post(reset_password))
}

// ── Login ──────────────────────────────────────────────────────────────

#[derive(Deserialize)]
struct LoginRequest {
    login: String,
    password: String,
}

async fn login(
    State(state): State<Arc<AppState>>,
    Json(body): Json<LoginRequest>,
) -> AppResult<Response> {
    let login_val = body.login.trim().to_string();
    let login_lower = login_val.to_lowercase();

    if login_val.is_empty() || body.password.is_empty() {
        return Err(AppError::BadRequest("Login dan password wajib diisi".into()));
    }

    // Rate limit: 5 per 15 min
    if !state.login_limiter.check(&login_lower) {
        return Err(AppError::RateLimited);
    }

    let user = sqlx::query_as::<_, UserRow>(
        "SELECT id, nama, username, email, no_hp, password, role, status, email_verified
         FROM users WHERE username = ? OR email = ? LIMIT 1"
    )
    .bind(&login_val)
    .bind(&login_lower)
    .fetch_optional(&state.db)
    .await?;

    let user = match user {
        Some(u) => u,
        None => return Err(AppError::BadRequest("Akun tidak ditemukan atau password salah".into())),
    };

    if user.status == "inactive" {
        if !user.email_verified {
            return Ok(Json(json!({
                "error": "Email belum diverifikasi. Silakan cek inbox email Anda.",
                "needVerification": true,
                "email": user.email
            })).into_response_with_status(axum::http::StatusCode::FORBIDDEN));
        }
        return Err(AppError::BadRequest("Akun Anda telah dinonaktifkan. Hubungi admin.".into()));
    }

    let valid = verify_password(&body.password, &user.password)?;
    if !valid {
        return Err(AppError::BadRequest("Akun tidak ditemukan atau password salah".into()));
    }

    // Update last_login_at
    sqlx::query("UPDATE users SET last_login_at = NOW() WHERE id = ?")
        .bind(user.id)
        .execute(&state.db)
        .await?;

    let current_user = CurrentUser {
        id: user.id,
        nama: user.nama.clone(),
        username: user.username.clone(),
        email: user.email.clone(),
        role: parse_role(&user.role),
    };

    let token = create_token(&current_user, &state.config.jwt_secret)
        .map_err(|e| AppError::Internal(format!("Token creation failed: {e}")))?;

    let cookie = build_auth_cookie(&token, 7 * 24 * 60 * 60);

    let body = json!({
        "message": "Login berhasil",
        "user": {
            "id": user.id,
            "nama": user.nama,
            "username": user.username,
            "email": user.email,
            "role": user.role,
        }
    });

    Ok(json_response_with_cookie(body, cookie))
}

// ── Register ───────────────────────────────────────────────────────────

#[derive(Deserialize)]
struct RegisterRequest {
    nama: Option<String>,
    username: Option<String>,
    email: Option<String>,
    no_hp: Option<String>,
    password: Option<String>,
}

async fn register(
    State(state): State<Arc<AppState>>,
    Json(body): Json<RegisterRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let nama = body.nama.unwrap_or_default().trim().to_string();
    let username = body.username.unwrap_or_default().trim().to_string();
    let email = body.email.unwrap_or_default().trim().to_lowercase();
    let no_hp = body.no_hp.unwrap_or_default().trim().to_string();
    let password = body.password.unwrap_or_default();

    if nama.is_empty() || username.is_empty() || email.is_empty() || no_hp.is_empty() || password.is_empty() {
        return Err(AppError::BadRequest("Semua field wajib diisi".into()));
    }

    // Rate limit: 5 per hour
    if !state.register_limiter.check(&email) {
        return Err(AppError::RateLimited);
    }

    if nama.len() < 2 {
        return Err(AppError::BadRequest("Nama minimal 2 karakter".into()));
    }
    if username.len() < 3 {
        return Err(AppError::BadRequest("Username minimal 3 karakter".into()));
    }

    let email_regex = regex_lite::Regex::new(r"^[^\s@]+@[^\s@]+\.[^\s@]+$").unwrap();
    if !email_regex.is_match(&email) {
        return Err(AppError::BadRequest("Format email tidak valid".into()));
    }

    let phone_clean: String = no_hp.chars().filter(|c| !matches!(c, ' ' | '-' | '(' | ')')).collect();
    let phone_regex = regex_lite::Regex::new(r"^(\+62|62|0)[0-9]{8,13}$").unwrap();
    if !phone_regex.is_match(&phone_clean) {
        return Err(AppError::BadRequest("Format nomor HP tidak valid (contoh: 081234567890)".into()));
    }

    if password.len() < 6 {
        return Err(AppError::BadRequest("Password minimal 6 karakter".into()));
    }

    // Check existing verified user
    let existing: Option<(i32,)> = sqlx::query_as(
        "SELECT id FROM users WHERE (email = ? AND email_verified = true) OR username = ? OR (no_hp = ? AND email_verified = true) LIMIT 1"
    )
    .bind(&email)
    .bind(&username)
    .bind(&phone_clean)
    .fetch_optional(&state.db)
    .await?;

    if existing.is_some() {
        return Err(AppError::Conflict("Email, username, atau nomor HP sudah terdaftar".into()));
    }

    // Delete unverified users with same email
    sqlx::query("DELETE FROM users WHERE email = ? AND email_verified = false")
        .bind(&email)
        .execute(&state.db)
        .await?;

    let hashed = hash_password(&password)?;

    sqlx::query(
        "INSERT INTO users (nama, username, email, no_hp, password, role, status, email_verified) VALUES (?, ?, ?, ?, ?, 'user', 'inactive', false)"
    )
    .bind(&nama)
    .bind(&username)
    .bind(&email)
    .bind(&phone_clean)
    .bind(&hashed)
    .execute(&state.db)
    .await?;

    // Invalidate old OTPs
    sqlx::query("UPDATE email_verifications SET used = true WHERE email = ? AND used = false")
        .bind(&email)
        .execute(&state.db)
        .await?;

    let otp = generate_otp();
    let expires_at = Utc::now().naive_utc() + chrono::Duration::minutes(10);

    sqlx::query("INSERT INTO email_verifications (email, otp, expires_at) VALUES (?, ?, ?)")
        .bind(&email)
        .bind(&otp)
        .bind(expires_at)
        .execute(&state.db)
        .await?;

    // Send OTP email
    if let Err(e) = state.mailer.send_otp_email(&email, &otp).await {
        tracing::error!("Failed to send OTP email: {e}");
        return Err(AppError::Internal("Gagal mengirim kode verifikasi ke email. Coba lagi.".into()));
    }

    Ok(Json(json!({
        "message": "Kode verifikasi telah dikirim ke email Anda",
        "requireVerification": true,
        "email": email
    })))
}

// ── Logout ─────────────────────────────────────────────────────────────

async fn logout() -> AppResult<Response> {
    let cookie = build_auth_cookie("", 0);
    let body = json!({ "message": "Logout berhasil" });
    Ok(json_response_with_cookie(body, cookie))
}

// ── Me ─────────────────────────────────────────────────────────────────

async fn me(
    State(state): State<Arc<AppState>>,
    user: Option<Extension<CurrentUser>>,
) -> AppResult<Json<serde_json::Value>> {
    let user = match user {
        Some(Extension(u)) => u,
        None => return Ok(Json(json!({ "user": null }))),
    };

    // Cross-check DB for role/status
    let db_user: Option<(String, String)> = sqlx::query_as(
        "SELECT role, status FROM users WHERE id = ?"
    )
    .bind(user.id)
    .fetch_optional(&state.db)
    .await?;

    let role = if let Some((db_role, db_status)) = &db_user {
        if db_status != "active" {
            return Ok(Json(json!({ "user": null })));
        }
        db_role.clone()
    } else {
        format!("{:?}", user.role).to_lowercase()
    };

    let mut result = json!({
        "user": {
            "id": user.id,
            "nama": user.nama,
            "username": user.username,
            "email": user.email,
            "role": role,
        }
    });

    if role == "reseller" {
        let active_users: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM users WHERE status = 'active' AND role = 'user'"
        )
        .fetch_one(&state.db)
        .await
        .unwrap_or((0,));

        let ceir_balance = match state.ceirid.get_balance().await {
            Ok(b) => crate::services::ceirid_client::extract_credit(&b),
            Err(_) => None,
        };

        result["resellerInfo"] = json!({
            "activeUsers": active_users.0,
            "ceirBalance": ceir_balance
        });
    }

    Ok(Json(result))
}

// ── Verify Email ───────────────────────────────────────────────────────

#[derive(Deserialize)]
struct VerifyEmailRequest {
    email: String,
    otp: String,
}

async fn verify_email(
    State(state): State<Arc<AppState>>,
    Json(body): Json<VerifyEmailRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let email = body.email.trim().to_lowercase();
    let otp = body.otp.trim().to_string();

    if email.is_empty() || otp.is_empty() {
        return Err(AppError::BadRequest("Email dan kode OTP wajib diisi".into()));
    }

    if !state.verify_limiter.check(&email) {
        return Err(AppError::RateLimited);
    }

    let record: Option<(i32, NaiveDateTime)> = sqlx::query_as(
        "SELECT id, expires_at FROM email_verifications WHERE email = ? AND otp = ? AND used = false ORDER BY created_at DESC LIMIT 1"
    )
    .bind(&email)
    .bind(&otp)
    .fetch_optional(&state.db)
    .await?;

    let (record_id, expires_at) = match record {
        Some(r) => r,
        None => return Err(AppError::BadRequest("Kode verifikasi salah".into())),
    };

    if Utc::now().naive_utc() > expires_at {
        return Err(AppError::BadRequest("Kode verifikasi sudah kadaluarsa. Silakan kirim ulang.".into()));
    }

    // Transaction: mark OTP used + activate user
    let mut tx = state.db.begin().await?;

    sqlx::query("UPDATE email_verifications SET used = true WHERE id = ?")
        .bind(record_id)
        .execute(&mut *tx)
        .await?;

    sqlx::query("UPDATE users SET email_verified = true, status = 'active' WHERE email = ?")
        .bind(&email)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;

    Ok(Json(json!({
        "message": "Email berhasil diverifikasi! Silakan login.",
        "verified": true
    })))
}

// ── Resend OTP ─────────────────────────────────────────────────────────

#[derive(Deserialize)]
struct ResendOtpRequest {
    email: String,
}

async fn resend_otp(
    State(state): State<Arc<AppState>>,
    Json(body): Json<ResendOtpRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let email = body.email.trim().to_lowercase();

    if email.is_empty() {
        return Err(AppError::BadRequest("Email wajib diisi".into()));
    }

    // Check user exists and not verified
    let user: Option<(i32, bool)> = sqlx::query_as(
        "SELECT id, email_verified FROM users WHERE email = ?"
    )
    .bind(&email)
    .fetch_optional(&state.db)
    .await?;

    match user {
        Some((_, true)) | None => {
            return Ok(Json(json!({ "message": "Kode verifikasi telah dikirim jika email terdaftar" })));
        }
        _ => {}
    }

    // 60-second cooldown
    let last_otp: Option<(NaiveDateTime,)> = sqlx::query_as(
        "SELECT created_at FROM email_verifications WHERE email = ? AND used = false ORDER BY created_at DESC LIMIT 1"
    )
    .bind(&email)
    .fetch_optional(&state.db)
    .await?;

    if let Some((created_at,)) = last_otp {
        let elapsed = (Utc::now().naive_utc() - created_at).num_seconds();
        if elapsed < 60 {
            return Err(AppError::BadRequest("Tunggu 60 detik sebelum mengirim ulang".into()));
        }
    }

    // Invalidate old OTPs
    sqlx::query("UPDATE email_verifications SET used = true WHERE email = ? AND used = false")
        .bind(&email)
        .execute(&state.db)
        .await?;

    let otp = generate_otp();
    let expires_at = Utc::now().naive_utc() + chrono::Duration::minutes(10);

    sqlx::query("INSERT INTO email_verifications (email, otp, expires_at) VALUES (?, ?, ?)")
        .bind(&email)
        .bind(&otp)
        .bind(expires_at)
        .execute(&state.db)
        .await?;

    if let Err(e) = state.mailer.send_otp_email(&email, &otp).await {
        tracing::error!("Failed to send OTP email: {e}");
        return Err(AppError::Internal("Gagal mengirim email".into()));
    }

    Ok(Json(json!({ "message": "Kode verifikasi baru telah dikirim" })))
}

// ── Forgot Password ───────────────────────────────────────────────────

#[derive(Deserialize)]
struct ForgotPasswordRequest {
    email: String,
}

async fn forgot_password(
    State(state): State<Arc<AppState>>,
    Json(body): Json<ForgotPasswordRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let email = body.email.trim().to_lowercase();

    if email.is_empty() {
        return Err(AppError::BadRequest("Email wajib diisi".into()));
    }

    if !state.forgot_limiter.check(&email) {
        return Err(AppError::RateLimited);
    }

    let generic_msg = json!({ "message": "Jika email terdaftar, link reset password telah dikirim" });

    let user: Option<(i32,)> = sqlx::query_as("SELECT id FROM users WHERE email = ?")
        .bind(&email)
        .fetch_optional(&state.db)
        .await?;

    if user.is_none() {
        return Ok(Json(generic_msg));
    }

    // Invalidate old tokens
    sqlx::query("UPDATE password_resets SET used = true WHERE email = ? AND used = false")
        .bind(&email)
        .execute(&state.db)
        .await?;

    let token = generate_token(32);
    let expires_at = Utc::now().naive_utc() + chrono::Duration::hours(1);

    sqlx::query("INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)")
        .bind(&email)
        .bind(&token)
        .bind(expires_at)
        .execute(&state.db)
        .await?;

    if let Err(e) = state.mailer.send_reset_email(&email, &token, &state.config.app_url).await {
        tracing::error!("Failed to send reset email: {e}");
        return Err(AppError::Internal("Gagal mengirim email. Coba lagi nanti.".into()));
    }

    Ok(Json(generic_msg))
}

// ── Reset Password ────────────────────────────────────────────────────

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ResetPasswordRequest {
    token: String,
    password: String,
    confirm_password: String,
}

async fn reset_password(
    State(state): State<Arc<AppState>>,
    Json(body): Json<ResetPasswordRequest>,
) -> AppResult<Json<serde_json::Value>> {
    if body.token.is_empty() || body.password.is_empty() || body.confirm_password.is_empty() {
        return Err(AppError::BadRequest("Semua field wajib diisi".into()));
    }

    if body.password.len() < 6 {
        return Err(AppError::BadRequest("Password minimal 6 karakter".into()));
    }

    if body.password != body.confirm_password {
        return Err(AppError::BadRequest("Konfirmasi password tidak cocok".into()));
    }

    let record: Option<(i32, String, bool, NaiveDateTime)> = sqlx::query_as(
        "SELECT id, email, used, expires_at FROM password_resets WHERE token = ?"
    )
    .bind(&body.token)
    .fetch_optional(&state.db)
    .await?;

    let (record_id, email, used, expires_at) = match record {
        Some(r) => r,
        None => return Err(AppError::BadRequest("Token tidak valid".into())),
    };

    if used {
        return Err(AppError::BadRequest("Token sudah digunakan".into()));
    }

    if Utc::now().naive_utc() > expires_at {
        return Err(AppError::BadRequest("Token sudah kadaluarsa. Silakan minta reset password ulang.".into()));
    }

    let hashed = hash_password(&body.password)?;

    let mut tx = state.db.begin().await?;

    sqlx::query("UPDATE users SET password = ? WHERE email = ?")
        .bind(&hashed)
        .bind(&email)
        .execute(&mut *tx)
        .await?;

    sqlx::query("UPDATE password_resets SET used = true WHERE id = ?")
        .bind(record_id)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;

    Ok(Json(json!({
        "message": "Password berhasil direset. Silakan login dengan password baru."
    })))
}

// ── Helpers ────────────────────────────────────────────────────────────

#[derive(sqlx::FromRow)]
struct UserRow {
    id: i32,
    nama: String,
    username: String,
    email: String,
    no_hp: String,
    password: String,
    role: String,
    status: String,
    email_verified: bool,
}

fn hash_password(password: &str) -> AppResult<String> {
    crate::middleware::auth::hash_password(password)
}

fn verify_password(password: &str, hash: &str) -> AppResult<bool> {
    Ok(crate::middleware::auth::verify_password(password, hash))
}

fn parse_role(role: &str) -> UserRole {
    match role {
        "admin" => UserRole::Admin,
        "superadmin" => UserRole::Superadmin,
        "reseller" => UserRole::Reseller,
        _ => UserRole::User,
    }
}

fn build_auth_cookie(token: &str, max_age_secs: i64) -> String {
    let secure = std::env::var("NODE_ENV").unwrap_or_default() == "production";
    let secure_str = if secure { "; Secure" } else { "" };
    format!(
        "bara_token={}; HttpOnly; SameSite=Lax; Path=/; Max-Age={}{}",
        token, max_age_secs, secure_str
    )
}

fn json_response_with_cookie(body: serde_json::Value, cookie: String) -> Response {
    let mut response = Json(body).into_response();
    response.headers_mut().insert(
        header::SET_COOKIE,
        cookie.parse().unwrap(),
    );
    response
}

trait IntoResponseWithStatus {
    fn into_response_with_status(self, status: axum::http::StatusCode) -> Response;
}

impl IntoResponseWithStatus for Json<serde_json::Value> {
    fn into_response_with_status(self, status: axum::http::StatusCode) -> Response {
        let mut response = self.into_response();
        *response.status_mut() = status;
        response
    }
}
