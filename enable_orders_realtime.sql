-- تشغيل المزامنة اللحظية (Realtime) لجدول الطلبات
-- انسخ هذا الكود وقم بتشغيله في لوحة تحكم Supabase في قسم SQL Editor
-- هذا سيضمن وصول إشعارات الطلبات الجديدة في أقل من ثانية وبدون الحاجة لتحديث الصفحة

alter publication supabase_realtime add table orders;
