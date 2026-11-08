-- Cekbar initial schema (matches existing Prisma-managed DB)
-- This migration is for reference / fresh installs only.
-- Existing databases already have these tables from Prisma.

CREATE TABLE IF NOT EXISTS `users` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(100) NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `no_hp` VARCHAR(20) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('user', 'reseller', 'admin', 'superadmin') NOT NULL DEFAULT 'user',
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'inactive',
    `email_verified` BOOLEAN NOT NULL DEFAULT FALSE,
    `last_login_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `users_username_key` (`username`),
    UNIQUE KEY `users_email_key` (`email`),
    UNIQUE KEY `users_no_hp_key` (`no_hp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `services` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `service_id` VARCHAR(100) NOT NULL,
    `service_name` VARCHAR(255) NOT NULL,
    `group_name` VARCHAR(100) NOT NULL,
    `category` VARCHAR(50) NULL,
    `api_provider` VARCHAR(50) NOT NULL DEFAULT 'dhru',
    `api_service_id` VARCHAR(100) NULL,
    `api_type` VARCHAR(50) NULL,
    `buy_price` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `sell_price` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `time_info` VARCHAR(255) NOT NULL DEFAULT '',
    `info` TEXT NULL,
    `min_qty` INT NOT NULL DEFAULT 1,
    `max_qty` VARCHAR(10) NOT NULL DEFAULT '',
    `custom_field_name` VARCHAR(100) NOT NULL DEFAULT '',
    `custom_field_regex` VARCHAR(255) NOT NULL DEFAULT '',
    `custom_field_maxlen` VARCHAR(10) NOT NULL DEFAULT '',
    `allow_bulk` BOOLEAN NOT NULL DEFAULT FALSE,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `last_synced_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `services_service_id_key` (`service_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `orders` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `order_id` VARCHAR(50) NOT NULL,
    `user_id` INT NOT NULL,
    `service_id` VARCHAR(100) NOT NULL,
    `service_name` VARCHAR(255) NOT NULL,
    `imei_list` JSON NOT NULL,
    `total_price` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `status` ENUM('PENDING_PAYMENT', 'PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'EXPIRED') NOT NULL DEFAULT 'PENDING_PAYMENT',
    `dhru_order_id` VARCHAR(100) NULL,
    `ceir_order_id` VARCHAR(100) NULL,
    `roamer_months` TINYINT NULL,
    `status_note` VARCHAR(255) NULL,
    `unit_price` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `results` JSON NULL,
    `is_direct_order` BOOLEAN NOT NULL DEFAULT FALSE,
    `is_manual_order` BOOLEAN NOT NULL DEFAULT FALSE,
    `admin_note` TEXT NULL,
    `processed_by` INT NULL,
    `processed_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `completed_at` TIMESTAMP NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `orders_order_id_key` (`order_id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_manual_status` (`is_manual_order`, `status`),
    CONSTRAINT `orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payments` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `payment_id` VARCHAR(50) NOT NULL,
    `order_id` VARCHAR(50) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `fee` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total_amount` DECIMAL(12, 2) NOT NULL,
    `qris_id` VARCHAR(100) NULL,
    `trx_id` VARCHAR(100) NULL,
    `qr_image` TEXT NULL,
    `qris_url` TEXT NULL,
    `gopay_transaction_id` VARCHAR(100) NULL,
    `payer_issuer` VARCHAR(50) NULL,
    `payment_type` VARCHAR(50) NULL,
    `status` ENUM('MENUNGGU', 'LUNAS', 'KADALUARSA', 'GAGAL') NOT NULL DEFAULT 'MENUNGGU',
    `confirmed_at` TIMESTAMP NULL,
    `expires_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `payments_payment_id_key` (`payment_id`),
    INDEX `idx_order_id` (`order_id`),
    INDEX `idx_payment_status` (`status`),
    CONSTRAINT `payments_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `system_settings` (
    `key_name` VARCHAR(100) NOT NULL,
    `value` TEXT NOT NULL,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`key_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `password_resets` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(100) NOT NULL,
    `token` VARCHAR(100) NOT NULL,
    `used` BOOLEAN NOT NULL DEFAULT FALSE,
    `expires_at` TIMESTAMP NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `password_resets_token_key` (`token`),
    INDEX `idx_reset_email` (`email`),
    INDEX `idx_reset_token` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `email_verifications` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(100) NOT NULL,
    `otp` VARCHAR(6) NOT NULL,
    `used` BOOLEAN NOT NULL DEFAULT FALSE,
    `expires_at` TIMESTAMP NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_verify_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

