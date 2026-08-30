-- إضافة أعمدة إعدادات عجلة الحظ في جدول app_settings بشكل مباشر في Supabase SQL Editor

ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS wheel_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS wheel_title TEXT DEFAULT 'دَوّر واكسب جوائز المنيو!',
ADD COLUMN IF NOT EXISTS wheel_prizes JSONB DEFAULT '[]'::jsonb;

-- ضمان وجود السجل الأساسي رقم 1
INSERT INTO public.app_settings (id, wheel_active, wheel_title)
VALUES (1, true, 'دَوّر واكسب جوائز المنيو!')
ON CONFLICT (id) DO NOTHING;
