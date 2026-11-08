use std::sync::Arc;
use axum::{
    extract::{FromRequestParts, Request, State},
    http::{header, request::Parts},
    middleware::Next,
    response::Response,
};
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde::{Deserialize, Serialize};

use crate::AppState;
use crate::error::AppError;
use crate::models::user::UserRole;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: i32,       // user id
    pub nama: String,
    pub username: String,
    pub email: String,
    pub role: UserRole,
    pub exp: usize,
    pub iat: usize,
}

#[derive(Debug, Clone)]
pub struct CurrentUser {
    pub id: i32,
    pub nama: String,
    pub username: String,
    pub email: String,
    pub role: UserRole,
}

impl From<Claims> for CurrentUser {
    fn from(claims: Claims) -> Self {
        Self {
            id: claims.sub,
            nama: claims.nama,
            username: claims.username,
            email: claims.email,
            role: claims.role,
        }
    }
}

impl FromRequestParts<Arc<AppState>> for CurrentUser {
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &Arc<AppState>) -> Result<Self, Self::Rejection> {
        let token = extract_token_from_parts(parts).ok_or(AppError::Unauthorized)?;
        let claims = verify_token(&token, &state.config.jwt_secret)
            .map_err(|_| AppError::Unauthorized)?;
        Ok(CurrentUser::from(claims))
    }
}

fn extract_token_from_parts(parts: &Parts) -> Option<String> {
    if let Some(cookie_header) = parts.headers.get(header::COOKIE) {
        if let Ok(cookies) = cookie_header.to_str() {
            for cookie in cookies.split(';') {
                let cookie = cookie.trim();
                if let Some(token) = cookie.strip_prefix("bara_token=") {
                    return Some(token.to_string());
                }
            }
        }
    }
    if let Some(auth_header) = parts.headers.get(header::AUTHORIZATION) {
        if let Ok(auth) = auth_header.to_str() {
            if let Some(token) = auth.strip_prefix("Bearer ") {
                return Some(token.to_string());
            }
        }
    }
    None
}

pub fn create_token(user: &CurrentUser, secret: &str) -> Result<String, jsonwebtoken::errors::Error> {
    let now = chrono::Utc::now().timestamp() as usize;
    let claims = Claims {
        sub: user.id,
        nama: user.nama.clone(),
        username: user.username.clone(),
        email: user.email.clone(),
        role: user.role.clone(),
        exp: now + 7 * 24 * 60 * 60, // 7 days
        iat: now,
    };
    jsonwebtoken::encode(
        &jsonwebtoken::Header::default(),
        &claims,
        &jsonwebtoken::EncodingKey::from_secret(secret.as_bytes()),
    )
}

pub fn verify_token(token: &str, secret: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
    let data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )?;
    Ok(data.claims)
}

/// Middleware that extracts JWT from cookie or Authorization header
pub async fn auth_middleware(
    State(state): State<Arc<AppState>>,
    mut req: Request,
    next: Next,
) -> Result<Response, AppError> {
    let token = extract_token(&req);

    if let Some(token) = token {
        match verify_token(&token, &state.config.jwt_secret) {
            Ok(claims) => {
                let user = CurrentUser::from(claims);
                req.extensions_mut().insert(user);
            }
            Err(_) => return Err(AppError::Unauthorized),
        }
    }

    Ok(next.run(req).await)
}

/// Middleware that requires authentication
pub async fn require_auth(
    State(state): State<Arc<AppState>>,
    mut req: Request,
    next: Next,
) -> Result<Response, AppError> {
    let token = extract_token(&req).ok_or(AppError::Unauthorized)?;
    let claims = verify_token(&token, &state.config.jwt_secret)
        .map_err(|_| AppError::Unauthorized)?;
    let user = CurrentUser::from(claims);
    req.extensions_mut().insert(user);
    Ok(next.run(req).await)
}

pub fn hash_password(password: &str) -> Result<String, AppError> {
    use argon2::{Argon2, PasswordHasher};
    let argon2 = Argon2::default();
    argon2
        .hash_password(password.as_bytes())
        .map(|h| h.to_string())
        .map_err(|e| AppError::Internal(format!("Password hash failed: {e}")))
}

pub fn verify_password(password: &str, hash: &str) -> bool {
    if hash.starts_with("$argon2") {
        use argon2::{Argon2, PasswordVerifier, PasswordHash};
        match PasswordHash::new(hash) {
            Ok(parsed) => Argon2::default().verify_password(password.as_bytes(), &parsed).is_ok(),
            Err(_) => false,
        }
    } else if hash.starts_with("$2") {
        bcrypt::verify(password, hash).unwrap_or(false)
    } else {
        false
    }
}

fn extract_token(req: &Request) -> Option<String> {
    // Try cookie first
    if let Some(cookie_header) = req.headers().get(header::COOKIE) {
        if let Ok(cookies) = cookie_header.to_str() {
            for cookie in cookies.split(';') {
                let cookie = cookie.trim();
                if let Some(token) = cookie.strip_prefix("bara_token=") {
                    return Some(token.to_string());
                }
            }
        }
    }

    // Try Authorization header
    if let Some(auth_header) = req.headers().get(header::AUTHORIZATION) {
        if let Ok(auth) = auth_header.to_str() {
            if let Some(token) = auth.strip_prefix("Bearer ") {
                return Some(token.to_string());
            }
        }
    }

    None
}

