-- ==============================================================================
-- مطعم جمر التنور - إغلاق وقفل ثغرة كاشير الفروع والتحكم
-- يمنع أي شخص أو متصفح أو لوحة أوامر من استخراج كلمات المرور أو تجاوز تسجيل الدخول
-- ==============================================================================

-- 1. تفعيل حماية RLS على جدول بيانات الفروع
ALTER TABLE IF EXISTS public.branch_credentials ENABLE ROW LEVEL SECURITY;

-- 2. إزالة أي سياسة سابقة تتيح قراءة كلمات المرور للعامة (anon)
DROP POLICY IF EXISTS "Allow anon select on branch_credentials" ON public.branch_credentials;
DROP POLICY IF EXISTS "Public select branch_credentials" ON public.branch_credentials;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.branch_credentials;

-- 3. حصر الوصول المباشر للجدول على مدير النظام فقط (service_role)
CREATE POLICY "Admin only branch_credentials" 
ON public.branch_credentials 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- سحب صلاحيات القراءة المباشرة من anon
REVOKE SELECT ON TABLE public.branch_credentials FROM anon;

-- 4. إنشاء دالة التحقق الآمنة (SECURITY DEFINER)
-- تتحقق من كلمة المرور داخل السيرفر وترجع فقط (true / false) دون إظهار كلمة المرور إطلاقاً
CREATE OR REPLACE FUNCTION public.verify_branch_login(p_branch_name TEXT, p_password TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_match BOOLEAN := false;
BEGIN
    SELECT (password = p_password) INTO v_match
    FROM public.branch_credentials
    WHERE branch_name = p_branch_name;

    IF v_match IS TRUE THEN
        RETURN jsonb_build_object(
            'success', true,
            'branch', p_branch_name
        );
    ELSE
        RETURN jsonb_build_object(
            'success', false,
            'error', 'كلمة المرور غير صحيحة'
        );
    END IF;
END;
$$;

-- السماح باستدعاء دالة التحقق فقط
GRANT EXECUTE ON FUNCTION public.verify_branch_login(TEXT, TEXT) TO anon, authenticated;

-- ==============================================================================
-- 5. لتغيير كلمات المرور الافتراضية (1234) إلى كلمات مرور سرية خاصة بك:
-- نفّذ الأسطر التالية بكلمات المرور التي تختارها:
-- ==============================================================================
-- UPDATE public.branch_credentials SET password = 'ضع_كلمة_سر_فرع_السويدي_هنا' WHERE branch_name = 'السويدي الغربي';
-- UPDATE public.branch_credentials SET password = 'ضع_كلمة_سر_فرع_طويق_هنا' WHERE branch_name = 'طويق';
-- UPDATE public.branch_credentials SET password = 'ضع_كلمة_سر_لوحة_الادارة_هنا' WHERE branch_name = 'admin';
