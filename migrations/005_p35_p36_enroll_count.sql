-- P35: mark campaigns that received new applications the admin has not looked at yet.
--   enroll_seen_count = the real application count when an admin last opened the
--   campaign detail. The list shows the applied number in red while the real count
--   is higher than this. NULL = never opened.
-- P36: let an admin override the displayed application count.
--   manual_enroll_count = the number to display instead of the real count.
--   NULL = show the real count. Setting it also refreshes enroll_seen_count, so a
--   manual edit never turns the number red (required by both slides).
ALTER TABLE mission ADD COLUMN enroll_seen_count INT NULL AFTER pin_deadline;
ALTER TABLE mission ADD COLUMN manual_enroll_count INT NULL AFTER enroll_seen_count;
