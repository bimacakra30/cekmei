# ── Build stage ──────────────────────────────────────────────────────
FROM rust:1.83-bookworm AS builder

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
# Cache deps
RUN mkdir src && echo "fn main(){}" > src/main.rs && cargo build --release && rm -rf src

COPY src ./src
COPY migrations ./migrations
RUN cargo build --release

# ── Runtime stage ───────────────────────────────────────────────────
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates libssl3 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/target/release/cekbar-api /app/cekbar-api
COPY --from=builder /app/migrations /app/migrations

EXPOSE 8080

CMD ["/app/cekbar-api"]

