-- P23: events get rich HTML content (KO + CN) for an on-site event detail page,
-- replacing the URL-only link-out. Mirrors notice.contents / notice.contents_cn.
ALTER TABLE event ADD COLUMN contents LONGTEXT NULL AFTER `order`;
ALTER TABLE event ADD COLUMN contents_cn LONGTEXT NULL AFTER contents;
