use hmac::{Hmac, Mac};
use sha2::Sha256;

type HmacSha256 = Hmac<Sha256>;

/// Verify HMAC-SHA256 signature
pub fn verify_hmac_sha256(key: &[u8], message: &[u8], signature: &str) -> bool {
    let Ok(mut mac) = HmacSha256::new_from_slice(key) else {
        return false;
    };
    mac.update(message);
    let expected = hex::encode(mac.finalize().into_bytes());
    expected == signature
}

/// Generate random hex token
pub fn generate_token(bytes: usize) -> String {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    let random_bytes: Vec<u8> = (0..bytes).map(|_| rng.gen()).collect();
    hex::encode(random_bytes)
}

/// Generate 6-digit OTP
pub fn generate_otp() -> String {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    let otp: u32 = rng.gen_range(100000..999999);
    otp.to_string()
}

