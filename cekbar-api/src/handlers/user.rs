use std::sync::Arc;
use axum::{Router, routing::get, Json, extract::State};
use serde::Deserialize;
use serde_json::json;

use crate::error::{AppError, AppResult};
use crate::middleware::auth::CurrentUser;
use crate::AppState;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/profile", get(get_profile).put(update_profile))
        .route("/change-password", axum::routing::post(change_password))
}

// GET /api/user/profile
async fn get_profile(
    State(state): State<Arc<AppState>>,
    user: CurrentUser,
) -> AppResult<Json<serde_json::Value>> {
    let row: Option<(i32, String, String, String, String, String, chrono::NaiveDateTime, Option<chrono::NaiveDateTime>)> = sqlx::query_as(
        "SELECT id, nama, username, email, no_hp, role, created_at, last_login_at FROM users WHERE id = ? LIMIT 1"
    )
    .bind(user.id)
    .fetch_optional(&state.db)
    .await?;

    match row {
        Some((id, nama, username, email, no_hp, role, created_at, last_login_at)) => {
            Ok(Json(json!({
                "id": id,
                "nama": nama,
                "username": username,
                "email": email,
                "no_hp": no_hp,
                "role": role,
                "created_at": created_at.format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string(),
                "last_login_at": last_login_at.map(|d| d.format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string()),
            })))
        }
        None => Err(AppError::NotFound("User tidak ditemukan".into())),
    }
}

#[derive(Deserialize)]
struct UpdateProfileBody {
    nama: Option<String>,
    email: Option<String>,
    no_hp: Option<String>,
}

// PUT /api/user/profile
async fn update_profile(
    State(state): State<Arc<AppState>>,
    user: CurrentUser,
    Json(body): Json<UpdateProfileBody>,
) -> AppResult<Json<serde_json::Value>> {
    let nama = body.nama.as_deref().unwrap_or("").trim();
    let email = body.email.as_deref().unwrap_or("").trim();
    let no_hp_raw = body.no_hp.as_deref().unwrap_or("").trim();

    if nama.is_empty() || email.is_empty() || no_hp_raw.is_empty() {
        return Err(AppError::BadRequest("Semua field wajib diisi".into()));
    }

    // Validate email
    let email_re = regex_lite::Regex::new(r"^[^\s@]+@[^\s@]+\.[^\s@]+$").unwrap();
    if !email_re.is_match(email) {
        return Err(AppError::BadRequest("Format email tidak valid".into()));
    }

    // Normalize phone
    let phone_digits: String = no_hp_raw.chars().filter(|c| c.is_ascii_digit() || *c == '+').collect();
    let phone_re = regex_lite::Regex::new(r"^(\+62|62|0)[0-9]{8,13}$").unwrap();
    if !phone_re.is_match(&phone_digits) {
        return Err(AppError::BadRequest("Format nomor HP tidak valid (contoh: 081234567890)".into()));
    }

    // Check email not changed
    let current_email: Option<(String,)> = sqlx::query_as(
        "SELECT email FROM users WHERE id = ? LIMIT 1"
    )
    .bind(user.id)
    .fetch_optional(&state.db)
    .await?;

    if let Some((cur,)) = &current_email {
        if email.to_lowercase() != cur.to_lowercase() {
            return Err(AppError::BadRequest("Perubahan email tidak diizinkan. Hubungi admin untuk mengubah email.".into()));
        }
    }

    // Check email uniqueness
    let dup_email: Option<(i32,)> = sqlx::query_as(
        "SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1"
    )
    .bind(email)
    .bind(user.id)
    .fetch_optional(&state.db)
    .await?;
    if dup_email.is_some() {
        return Err(AppError::Conflict("Email sudah digunakan akun lain".into()));
    }

    // Check phone uniqueness
    let dup_phone: Option<(i32,)> = sqlx::query_as(
        "SELECT id FROM users WHERE no_hp = ? AND id != ? LIMIT 1"
    )
    .bind(&phone_digits)
    .bind(user.id)
    .fetch_optional(&state.db)
    .await?;
    if dup_phone.is_some() {
        return Err(AppError::Conflict("Nomor HP sudah digunakan akun lain".into()));
    }

    sqlx::query("UPDATE users SET nama = ?, email = ?, no_hp = ? WHERE id = ?")
        .bind(nama)
        .bind(email)
        .bind(&phone_digits)
        .bind(user.id)
        .execute(&state.db)
        .await?;

    // Return updated user
    let row: Option<(i32, String, String, String, String, String)> = sqlx::query_as(
        "SELECT id, nama, username, email, no_hp, role FROM users WHERE id = ? LIMIT 1"
    )
    .bind(user.id)
    .fetch_optional(&state.db)
    .await?;

    match row {
        Some((id, nama, username, email, no_hp, role)) => {
            Ok(Json(json!({
                "id": id,
                "nama": nama,
                "username": username,
                "email": email,
                "no_hp": no_hp,
                "role": role,
            })))
        }
        None => Err(AppError::NotFound("User tidak ditemukan".into())),
    }
}

#[derive(Deserialize)]
struct ChangePasswordBody {
    #[serde(rename = "currentPassword")]
    current_password: String,
    #[serde(rename = "newPassword")]
    new_password: String,
    #[serde(rename = "confirmPassword")]
    confirm_password: String,
}

// POST /api/user/change-password
async fn change_password(
    State(state): State<Arc<AppState>>,
    user: CurrentUser,
    Json(body): Json<ChangePasswordBody>,
) -> AppResult<Json<serde_json::Value>> {
    if body.current_password.is_empty() || body.new_password.is_empty() || body.confirm_password.is_empty() {
        return Err(AppError::BadRequest("Semua field wajib diisi".into()));
    }

    if body.new_password.len() < 6 {
        return Err(AppError::BadRequest("Password baru minimal 6 karakter".into()));
    }

    if body.new_password != body.confirm_password {
        return Err(AppError::BadRequest("Konfirmasi password tidak cocok".into()));
    }

    let row: Option<(String,)> = sqlx::query_as(
        "SELECT password FROM users WHERE id = ? LIMIT 1"
    )
    .bind(user.id)
    .fetch_optional(&state.db)
    .await?;

    let (stored_hash,) = row.ok_or_else(|| AppError::NotFound("User tidak ditemukan".into()))?;

    // Verify old password (support bcrypt + argon2)
    if !crate::middleware::auth::verify_password(&body.current_password, &stored_hash) {
        return Err(AppError::BadRequest("Password lama salah".into()));
    }

    // Hash new password with argon2
    let new_hash = crate::middleware::auth::hash_password(&body.new_password)
        .map_err(|e| AppError::Internal(format!("Hash error: {}", e)))?;

    sqlx::query("UPDATE users SET password = ? WHERE id = ?")
        .bind(&new_hash)
        .bind(user.id)
        .execute(&state.db)
        .await?;

    Ok(Json(json!({ "message": "Password berhasil diubah" })))
}
