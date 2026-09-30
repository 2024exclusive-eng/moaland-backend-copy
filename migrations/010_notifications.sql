-- Apply once before NOTIFICATIONS_ENABLED=true. No existing campaign/user rows modified.
CREATE TABLE IF NOT EXISTS notification_visit (
 enroll_id BIGINT NOT NULL PRIMARY KEY,
 visit_at DATETIME(3) NULL, completed_at DATETIME(3) NULL,
 timezone VARCHAR(40) NOT NULL DEFAULT 'Asia/Seoul',
 revision INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS notification_job (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 event_key VARCHAR(190) NOT NULL UNIQUE,
 enroll_id BIGINT NOT NULL, recipient_user_id BIGINT NOT NULL,
 recipient_admin_id BIGINT NULL,
 kind VARCHAR(32) NOT NULL, revision INT NOT NULL DEFAULT 0,
 due_at DATETIME(3) NOT NULL, expires_at DATETIME(3) NOT NULL,
 state VARCHAR(24) NOT NULL DEFAULT 'pending', reason VARCHAR(64) NULL,
 sent_at DATETIME(3) NULL, created DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 INDEX notification_due(state,due_at), INDEX notification_enroll(enroll_id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS notification_admin_binding (
 admin_id BIGINT NOT NULL PRIMARY KEY, user_id BIGINT NULL,
 code_hash CHAR(64) NULL UNIQUE, expires_at DATETIME(3) NULL
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS notification_subscription (
 user_id BIGINT NOT NULL, template_id VARCHAR(128) NOT NULL,
 choice VARCHAR(12) NOT NULL, updated DATETIME(3) NOT NULL,
 PRIMARY KEY(user_id,template_id)
) ENGINE=InnoDB;
