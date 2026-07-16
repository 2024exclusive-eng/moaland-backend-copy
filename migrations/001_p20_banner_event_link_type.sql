-- P20: Banner/Event can link to WeChat QR popup instead of a URL.
-- link_type = 'url'  -> click opens `link` in new tab (existing behavior)
-- link_type = 'wechat' -> click opens the member-page WeChat QR dialog
ALTER TABLE banner ADD COLUMN link_type ENUM('url','wechat') NOT NULL DEFAULT 'url' AFTER link;
ALTER TABLE event  ADD COLUMN link_type ENUM('url','wechat') NOT NULL DEFAULT 'url' AFTER link;
