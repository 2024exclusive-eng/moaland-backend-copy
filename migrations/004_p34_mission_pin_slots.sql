-- P34: admin can pin campaigns to fixed slots in the member home sections.
-- NULL = not pinned. A value is the slot order (1 = first) within that section.
-- Sorting with `pin_x IS NULL, pin_x ASC` puts pinned campaigns first in one
-- single query, so a pinned campaign can never also appear in the auto-sorted
-- part of the same section (the "no duplicate exposure" requirement).
ALTER TABLE mission ADD COLUMN pin_new INT NULL AFTER is_recommended;
ALTER TABLE mission ADD COLUMN pin_deadline INT NULL AFTER pin_new;
