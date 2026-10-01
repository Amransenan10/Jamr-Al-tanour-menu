-- ==========================================
-- كود تحديث قاعدة البيانات المُعدّل (آمن 100% ولا يخرج أي خطأ)
-- قم بنسخ الكود أدناه ولصقه في SQL Editor بالضغط على Run
-- ==========================================

-- 1. إضافة أعمدة عجلة الحظ والإعدادات العامة بجدول app_settings
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS wheel_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS wheel_title TEXT DEFAULT 'دَوّر واكسب جوائز المنيو!',
ADD COLUMN IF NOT EXISTS wheel_prizes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS announcement_text TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS announcement_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS offers_title TEXT DEFAULT 'العروض الأسبوعية',
ADD COLUMN IF NOT EXISTS offers_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS event_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS event_preset TEXT DEFAULT 'saudi_national_day',
ADD COLUMN IF NOT EXISTS event_title TEXT DEFAULT 'اليوم الوطني السعودي 🇸🇦',
ADD COLUMN IF NOT EXISTS event_subtitle TEXT DEFAULT 'نحتفل معكم باليوم الوطني!',
ADD COLUMN IF NOT EXISTS event_promo_code TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS event_show_confetti BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS event_show_modal BOOLEAN DEFAULT true;

-- 2. إدخال السجل الرئيسي رقم 1
INSERT INTO public.app_settings (id, wheel_active, wheel_title, announcement_active, offers_active)
VALUES (1, true, 'دَوّر واكسب جوائز المنيو!', true, true)
ON CONFLICT (id) DO UPDATE SET wheel_active = EXCLUDED.wheel_active;

-- 3. تحديث قيد أنواع الكوبونات لدعم (توصيل مجاني free_delivery)
ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS coupons_discount_type_check;
ALTER TABLE public.coupons ADD CONSTRAINT coupons_discount_type_check CHECK (discount_type IN ('percentage', 'fixed', 'free_delivery'));

-- 4. إضافة عمود ربط الرقم بجدول الكوبونات
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS bound_phone TEXT DEFAULT NULL;

-- 5. إضافة عمود مسافة التوصيل لجدول الطلبات
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS distance_km NUMERIC DEFAULT NULL;

-- 6. تفعيل المزامنة المباشرة Realtime مع تجنب تكرار الإضافة
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'app_settings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE app_settings;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'coupons'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE coupons;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'products'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE products;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'categories'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE categories;
    END IF;
END $$;
