use std::sync::Arc;
use axum::{
    extract::{Query, State},
    routing::get,
    Json, Router,
};
use serde::Deserialize;
use serde_json::json;

use crate::error::AppResult;
use crate::AppState;

pub fn router() -> Router<Arc<AppState>> {
    Router::new().route("/", get(list_public))
}

#[derive(Deserialize)]
struct ServiceQuery {
    group: Option<String>,
    category: Option<String>,
}

async fn list_public(
    State(state): State<Arc<AppState>>,
    Query(q): Query<ServiceQuery>,
) -> AppResult<Json<serde_json::Value>> {
    let mut where_clause = "category IS NOT NULL".to_string();
    let mut binds: Vec<String> = Vec::new();

    if let Some(ref group) = q.group {
        if group != "ALL" && !group.is_empty() {
            where_clause.push_str(" AND group_name = ?");
            binds.push(group.clone());
        }
    }
    if let Some(ref category) = q.category {
        if !category.is_empty() {
            where_clause.push_str(" AND category = ?");
            binds.push(category.clone());
        }
    }

    let sql = format!(
        r#"SELECT id, service_id, service_name, group_name, category,
                  CAST(sell_price AS CHAR) as sell_price,
                  COALESCE(time_info, '') as time_info,
                  info,
                  COALESCE(min_qty, 1) as min_qty,
                  COALESCE(max_qty, '1') as max_qty,
                  COALESCE(custom_field_name, '') as custom_field_name,
                  COALESCE(custom_field_regex, '') as custom_field_regex,
                  COALESCE(custom_field_maxlen, '0') as custom_field_maxlen,
                  COALESCE(allow_bulk, false) as allow_bulk,
                  is_active
           FROM services
           WHERE {}
           ORDER BY group_name ASC, service_name ASC"#,
        where_clause
    );

    let mut query = sqlx::query_as::<_, ServicePublicRow>(&sql);
    for b in &binds {
        query = query.bind(b);
    }
    let services: Vec<ServicePublicRow> = query.fetch_all(&state.db).await?;

    // Distinct groups
    let groups: Vec<(String,)> = sqlx::query_as(
        "SELECT DISTINCT group_name FROM services WHERE is_active = true ORDER BY group_name ASC"
    )
    .fetch_all(&state.db)
    .await?;

    let total = services.len();

    let services_json: Vec<serde_json::Value> = services.iter().map(|s| {
        json!({
            "id": s.id,
            "service_id": s.service_id,
            "service_name": s.service_name,
            "group_name": s.group_name,
            "category": s.category,
            "sell_price": s.sell_price,
            "time_info": s.time_info,
            "info": s.info,
            "min_qty": s.min_qty,
            "max_qty": s.max_qty,
            "custom_field_name": s.custom_field_name,
            "custom_field_regex": s.custom_field_regex,
            "custom_field_maxlen": s.custom_field_maxlen,
            "allow_bulk": s.allow_bulk,
            "is_active": s.is_active,
        })
    }).collect();

    Ok(Json(json!({
        "services": services_json,
        "groups": groups.iter().map(|g| &g.0).collect::<Vec<_>>(),
        "total": total,
    })))
}

#[derive(sqlx::FromRow)]
struct ServicePublicRow {
    id: i32,
    service_id: String,
    service_name: String,
    group_name: String,
    category: Option<String>,
    sell_price: String,
    time_info: String,
    info: Option<String>,
    min_qty: i32,
    max_qty: String,
    custom_field_name: String,
    custom_field_regex: String,
    custom_field_maxlen: String,
    allow_bulk: bool,
    is_active: bool,
}
