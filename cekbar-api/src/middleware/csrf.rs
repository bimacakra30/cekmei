use axum::{
    extract::Request,
    http::header,
    middleware::Next,
    response::Response,
};

use crate::error::AppError;

pub async fn csrf_middleware(
    req: Request,
    next: Next,
) -> Result<Response, AppError> {
    // Only check mutating methods
    let method = req.method().clone();
    if method == "GET" || method == "HEAD" || method == "OPTIONS" {
        return Ok(next.run(req).await);
    }

    let host = req.headers()
        .get(header::HOST)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    let origin = req.headers()
        .get(header::ORIGIN)
        .and_then(|v| v.to_str().ok());

    let referer = req.headers()
        .get(header::REFERER)
        .and_then(|v| v.to_str().ok());

    let valid = if let Some(origin) = origin {
        origin.contains(host)
    } else if let Some(referer) = referer {
        referer.contains(host)
    } else {
        false
    };

    if !valid && !host.is_empty() {
        return Err(AppError::Forbidden);
    }

    Ok(next.run(req).await)
}

