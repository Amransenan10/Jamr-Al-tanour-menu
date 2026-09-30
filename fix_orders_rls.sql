-- ========================================================
-- حل مشكلة عدم حفظ حالة الطلب (RLS Update Policy for Orders)
-- تشغيل هذا الملف في لوحة تحكم Supabase -> SQL Editor
-- ========================================================

-- 1. تفعيل الصلاحيات لجدول الطلبات orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 2. إنشاء سياسات السماح للتحديث والقراءة والإضافة لجميع المستخدمين
DROP POLICY IF EXISTS "Allow public select on orders" ON orders;
CREATE POLICY "Allow public select on orders" ON orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on orders" ON orders;
CREATE POLICY "Allow public insert on orders" ON orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on orders" ON orders;
CREATE POLICY "Allow public update on orders" ON orders FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete on orders" ON orders;
CREATE POLICY "Allow public delete on orders" ON orders FOR DELETE USING (true);
