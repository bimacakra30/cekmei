use chrono::Utc;
use rand::Rng;

/// Generate unique order ID: CEKBAR-ORD-YYYYMMDD-XXXXX
pub fn generate_order_id() -> String {
    let now = Utc::now();
    let date = now.format("%Y%m%d");
    let mut rng = rand::thread_rng();
    let random: u32 = rng.gen_range(10000..99999);
    format!("CEKBAR-ORD-{}-{}", date, random)
}

/// Generate unique payment ID: CEKBAR-PAY-YYYYMMDD-XXXXX
pub fn generate_payment_id() -> String {
    let now = Utc::now();
    let date = now.format("%Y%m%d");
    let mut rng = rand::thread_rng();
    let random: u32 = rng.gen_range(10000..99999);
    format!("CEKBAR-PAY-{}-{}", date, random)
}

