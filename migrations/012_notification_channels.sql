-- Apply after 010 and 011, once. Sending must remain disabled.
ALTER TABLE notification_visit ADD confirmed_visit_at DATETIME(3) NULL;
-- Legacy visit_at was labelled confirmed visit time; preserve already confirmed entries.
UPDATE notification_visit SET confirmed_visit_at=visit_at WHERE visit_at IS NOT NULL;
ALTER TABLE notification_job ADD channel VARCHAR(16) NOT NULL DEFAULT 'wechat';
UPDATE notification_job SET state='cancelled',reason='channel_migration'
 WHERE kind IN ('application','schedule','visit') AND state IN ('pending','blocked');
CREATE TABLE notification_enrollment_subscription (
 user_id BIGINT NOT NULL, enroll_id BIGINT NOT NULL,
 template_id VARCHAR(128) NOT NULL, phase VARCHAR(16) NOT NULL,
 choice VARCHAR(12) NOT NULL, updated DATETIME(3) NOT NULL,
 PRIMARY KEY(user_id,enroll_id,template_id)
) ENGINE=InnoDB;
CREATE TABLE notification_consent_event (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT NOT NULL, enroll_id BIGINT NOT NULL,
 phase VARCHAR(16) NOT NULL, decision VARCHAR(12) NOT NULL,
 choices JSON NOT NULL, created DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 INDEX enrollment_consent(user_id,enroll_id)
) ENGINE=InnoDB;
