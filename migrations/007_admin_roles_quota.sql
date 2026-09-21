-- Apply once, after backup and duplicate-login preflight. Existing accounts are company operators.
-- SELECT admin, COUNT(*) FROM admin GROUP BY admin HAVING COUNT(*) > 1; must return no rows.
ALTER TABLE admin
 ADD COLUMN role ENUM('super_admin','advertiser') NULL,
 ADD COLUMN is_active TINYINT NOT NULL DEFAULT 1,
 ADD COLUMN company_name VARCHAR(120) NOT NULL DEFAULT '',
 ADD COLUMN contact_email VARCHAR(254) NOT NULL DEFAULT '',
 ADD COLUMN monthly_limit INT UNSIGNED NULL DEFAULT 0,
 ADD COLUMN token_version INT UNSIGNED NOT NULL DEFAULT 0;
UPDATE admin SET role='super_admin', monthly_limit=NULL WHERE role IS NULL;
ALTER TABLE admin MODIFY role ENUM('super_admin','advertiser') NOT NULL DEFAULT 'advertiser';
CREATE UNIQUE INDEX admin_login_unique ON admin(admin);
ALTER TABLE mission ADD COLUMN owner_admin_id BIGINT UNSIGNED NULL,
 ADD INDEX mission_owner_admin (owner_admin_id);
CREATE TABLE admin_campaign_usage (
 admin_id BIGINT UNSIGNED NOT NULL, month_key CHAR(7) NOT NULL,
 used INT UNSIGNED NOT NULL DEFAULT 0,
 PRIMARY KEY (admin_id, month_key)
) ENGINE=InnoDB;
CREATE TABLE admin_security_lock (id TINYINT PRIMARY KEY) ENGINE=InnoDB;
INSERT INTO admin_security_lock (id) VALUES (1);
-- Existing campaigns remain unassigned and visible only to super administrators until assigned.
