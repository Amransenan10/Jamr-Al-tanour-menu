-- تحديث جدول الكوبونات لإضافة الحد الأدنى للطلب
-- لتشغيله في لوحة تحكم Supabase
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS min_order_value NUMERIC DEFAULT 0;
