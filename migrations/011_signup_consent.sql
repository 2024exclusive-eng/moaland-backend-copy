-- Apply before SIGNUP_CONSENT_ENABLED=true. Append-only consent history.
CREATE TABLE IF NOT EXISTS user_consent (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT NOT NULL,
 purpose VARCHAR(32) NOT NULL,
 version VARCHAR(32) NOT NULL,
 choice VARCHAR(16) NOT NULL,
 recorded_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 INDEX consent_user(user_id,purpose,recorded_at)
) ENGINE=InnoDB;
