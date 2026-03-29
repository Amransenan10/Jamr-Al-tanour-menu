CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. إضافة أعمدة التوصيل والاستلام لجدول إعدادات المطعم
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS is_delivery_active BOOLEAN DEFAULT true;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS is_pickup_active BOOLEAN DEFAULT true;

-- 2. إنشاء حساب خاص بمدير النظام (Admin) للدخول إلى لوحة التحكم
INSERT INTO branch_credentials (branch_name, password)
VALUES ('admin', 'admin123')
ON CONFLICT (branch_name) DO NOTHING;

-- 3. جداول الخيارات المتقدمة (Size, Choice, etc.)
CREATE TABLE IF NOT EXISTS option_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    min_selection INTEGER DEFAULT 0,
    max_selection INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS option_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES option_groups(id) ON DELETE CASCADE,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    price NUMERIC DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. نظام الكوبونات والخصومات
CREATE TABLE IF NOT EXISTS coupons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC NOT NULL,
    is_active BOOLEAN DEFAULT true,
    max_uses INTEGER DEFAULT NULL,
    current_uses INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. تحديث جدول الطلبات لدعم رسوم التوصيل والخصومات
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code TEXT;

-- تمكين الـ Realtime للجداول الحساسة
alter publication supabase_realtime add table coupons;
alter publication supabase_realtime add table option_groups;
alter publication supabase_realtime add table option_items;
alter publication supabase_realtime add table products;
