-- ==============================================================================
-- إنشاء جدول أجهزة وتابلت الكاشير المصرح لها (Cashier Devices Authorization)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.cashier_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL UNIQUE,
    branch_name TEXT,
    device_name TEXT DEFAULT 'تابلت كاشير',
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'blocked'
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_seen TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cashier_devices ENABLE ROW LEVEL SECURITY;

-- 1. القراءة: متاحة للتحقق من حالة الجهاز
DROP POLICY IF EXISTS "Allow anon read cashier_devices" ON public.cashier_devices;
CREATE POLICY "Allow anon read cashier_devices" 
ON public.cashier_devices 
FOR SELECT 
TO anon, authenticated
USING (true);

-- 2. الإضافة: متاحة لأجهزة الكاشير لإرسال طلب الاعتماد
DROP POLICY IF EXISTS "Allow anon insert cashier_devices" ON public.cashier_devices;
CREATE POLICY "Allow anon insert cashier_devices" 
ON public.cashier_devices 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- 3. التحديث: متاح للوحة الإدارة أو تحديث وقت آخر ظهور
DROP POLICY IF EXISTS "Allow anon update cashier_devices" ON public.cashier_devices;
CREATE POLICY "Allow anon update cashier_devices" 
ON public.cashier_devices 
FOR UPDATE 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 4. الحذف: متاح للإدارة لحذف جهاز
DROP POLICY IF EXISTS "Allow anon delete cashier_devices" ON public.cashier_devices;
CREATE POLICY "Allow anon delete cashier_devices" 
ON public.cashier_devices 
FOR DELETE 
TO anon, authenticated
USING (true);

-- 5. خدمة service_role بكامل الصلاحيات
DROP POLICY IF EXISTS "Admin full control on cashier_devices" ON public.cashier_devices;
CREATE POLICY "Admin full control on cashier_devices" 
ON public.cashier_devices 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- تفعيل Realtime على الجدول لتلقي الموافقات فورياً دون الحاجة لإعادة تحميل الصفحة
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'cashier_devices'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.cashier_devices;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;
