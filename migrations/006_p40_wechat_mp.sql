-- Preflight MUST return zero rows before applying (do not auto-delete duplicates):
-- SELECT oauth_type, oauth_id, COUNT(*) FROM user WHERE oauth_type IS NOT NULL AND oauth_id IS NOT NULL GROUP BY oauth_type, oauth_id HAVING COUNT(*) > 1;
-- Read-only production preflight verified on 2026-09-18:
-- email is nullable; oauth_type is ENUM('GOOGLE','DISCORD','TWITTER','WALLET').
-- Existing unique_oauth(oauth_type, oauth_id) already enforces uniqueness.
-- Preserve existing ENUM order and append WECHAT_MP to avoid changing stored enum indexes.
-- Back up/snapshot the database before applying. DDL is not transactionally reversible.
-- Recheck the schema if deploying to a different database; add an equivalent unique index if absent.
ALTER TABLE user MODIFY COLUMN oauth_type ENUM('GOOGLE','DISCORD','TWITTER','WALLET','WECHAT_MP') NULL DEFAULT NULL;
ALTER TABLE mission ADD COLUMN is_wechat_public TINYINT(1) NOT NULL DEFAULT 0 AFTER is_public;
ALTER TABLE user ADD COLUMN wx_unionid VARCHAR(64) NULL AFTER oauth_id;
ALTER TABLE user ADD COLUMN signup_channel ENUM('web','wechat_mp') NOT NULL DEFAULT 'web' AFTER wx_unionid;
ALTER TABLE mission_enroll ADD COLUMN channel ENUM('web','wechat_mp') NOT NULL DEFAULT 'web' AFTER memo;
ALTER TABLE mission_enroll ADD COLUMN crossborder_consent_at DATETIME NULL AFTER channel;
-- Do not create a redundant unique index: verified existing unique_oauth covers these columns.
