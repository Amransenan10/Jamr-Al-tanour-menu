-- إضافة عمود السعرات لجدول الأصناف
ALTER TABLE products ADD COLUMN IF NOT EXISTS calories INTEGER DEFAULT NULL;

-- إضافة عمود السعرات لجدول الخيارات الفرعية
ALTER TABLE option_items ADD COLUMN IF NOT EXISTS calories INTEGER DEFAULT NULL;
