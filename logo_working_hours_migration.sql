-- إضافة أعمدة اللوجو وأوقات الدوام لجدول الإعدادات
ALTER TABLE app_settings
ADD COLUMN IF NOT EXISTS logo_url text NULL,
ADD COLUMN IF NOT EXISTS working_hours text NULL;
