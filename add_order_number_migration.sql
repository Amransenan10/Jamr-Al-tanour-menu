-- ==============================================================================
-- الهجرة البرمجية: ترقيم الطلبات المتسلسل (#151001 فصاعداً)
-- مطعم جمر التنور
-- ==============================================================================

-- 1. إضافة عمود order_number لجدول الطلبات إذا لم يكن موجوداً
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number BIGINT;

-- 2. إنشاء تسلسل تسلسلي يبدأ من 151001 (أي الطلب رقم 1001 مسبوقاً برقم الفرع 15)
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 151001;

-- 3. جعل القيمة الافتراضية للعمود تأخذ من التسلسل تلقائياً عند أي إدراج جديد
ALTER TABLE public.orders ALTER COLUMN order_number SET DEFAULT nextval('order_number_seq');

-- 4. فهرس سريع للبحث برقم الطلب
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- 5. تحديث وترقيم الطلبات السابقة بالترتيب الزمني إن وجدت
UPDATE public.orders 
SET order_number = 150000 + sub.seq_id
FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as seq_id
    FROM public.orders
    WHERE order_number IS NULL
) sub
WHERE public.orders.id = sub.id AND public.orders.order_number IS NULL;

-- 6. التأكد من أن العداد الحالي يسبق أحدث طلب مسجل
SELECT setval('order_number_seq', GREATEST(151000, COALESCE((SELECT MAX(order_number) FROM public.orders), 151000)) + 1, false);
