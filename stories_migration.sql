-- إضافة حقل is_hidden لمنتجات العروض
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

-- إنشاء جدول القصص
CREATE TABLE IF NOT EXISTS stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_url TEXT NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- إعداد الصلاحيات (RLS) للقصص
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- مسموح للجميع قراءة القصص النشطة
CREATE POLICY "Public profiles are viewable by everyone." 
ON stories FOR SELECT 
USING (is_active = true);

-- المشرفون يمكنهم الوصول لكل شيء (أو تعطيل RLS للمشرفين إذا كانت الجداول الأخرى لا تستخدمه بصرامة)
-- بافتراض أنك تستخدم مفتاح service_role في لوحة التحكم، سيتخطى هو الـ RLS تلقائياً.
