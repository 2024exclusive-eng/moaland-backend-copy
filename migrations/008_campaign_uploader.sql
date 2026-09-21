-- Original uploader is independent of the reassignable campaign owner.
-- Historical uploader cannot be reliably inferred; leave existing rows NULL.
ALTER TABLE mission
  ADD COLUMN created_by_admin_id INT NULL,
  ADD INDEX idx_mission_created_by_admin (created_by_admin_id);
