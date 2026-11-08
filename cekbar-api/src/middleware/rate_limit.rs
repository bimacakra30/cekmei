use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{Duration, Instant};

pub struct RateLimiter {
    requests: Mutex<HashMap<String, Vec<Instant>>>,
    max_requests: usize,
    interval: Duration,
}

impl RateLimiter {
    pub fn new(max_requests: usize, interval: Duration) -> Self {
        Self {
            requests: Mutex::new(HashMap::new()),
            max_requests,
            interval,
        }
    }

    pub fn check(&self, key: &str) -> bool {
        let mut requests = self.requests.lock().unwrap();
        let now = Instant::now();

        let entries = requests.entry(key.to_string()).or_default();

        // Remove expired entries
        entries.retain(|&t| now.duration_since(t) < self.interval);

        if entries.len() >= self.max_requests {
            return false;
        }

        entries.push(now);
        true
    }

    pub fn cleanup(&self) {
        let mut requests = self.requests.lock().unwrap();
        let now = Instant::now();
        requests.retain(|_, entries| {
            entries.retain(|&t| now.duration_since(t) < self.interval);
            !entries.is_empty()
        });
    }
}

