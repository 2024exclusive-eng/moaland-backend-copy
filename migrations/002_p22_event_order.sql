-- P22: events get a manual display order (like banners), enabling drag-reorder.
ALTER TABLE event ADD COLUMN `order` INT NOT NULL DEFAULT 0 AFTER link_type;
-- backfill existing rows by creation time
SET @i := 0;
UPDATE event SET `order` = (@i := @i + 1) ORDER BY created ASC;
