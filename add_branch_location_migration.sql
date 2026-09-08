-- إضافة أعمدة موقع الفرع والإحداثيات لجدول store_settings
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS longitude NUMERIC;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS google_maps_url TEXT;

-- تحديث إحداثيات افتراضية لفرع السويدي الغربي وفرع طويق في حال عدم إدخالها
UPDATE store_settings SET latitude = 24.5937, longitude = 46.6111 WHERE branch_name = 'السويدي الغربي' AND latitude IS NULL;
UPDATE store_settings SET latitude = 24.5772, longitude = 46.5412 WHERE branch_name = 'طويق' AND latitude IS NULL;
