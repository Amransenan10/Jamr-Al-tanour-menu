-- إضافة أعمدة موقع الفرع والإحداثيات لجدول store_settings
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS longitude NUMERIC;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS google_maps_url TEXT;

-- إضافة عمود المسافة لجدول الطلبات
ALTER TABLE orders ADD COLUMN IF NOT EXISTS distance_km NUMERIC;

-- تحديث إحداثيات فرع السويدي الغربي وفرع طويق
UPDATE store_settings SET latitude = 24.5761708, longitude = 46.6288971, google_maps_url = 'https://share.google/IzPlL1pu9z0vsXUJQ' WHERE branch_name = 'السويدي الغربي';
UPDATE store_settings SET latitude = 24.5593042, longitude = 46.5714602, google_maps_url = 'https://share.google/0x4b2cnGTZSr9OxDo' WHERE branch_name = 'طويق';


