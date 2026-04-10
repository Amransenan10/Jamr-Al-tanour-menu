-- جدول الإعدادات العامة للتطبيق (رسائل وإعلانات، وتواصل اجتماعي)
CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    announcement_text TEXT DEFAULT '',
    announcement_active BOOLEAN DEFAULT false,
    social_instagram TEXT DEFAULT '',
    social_snapchat TEXT DEFAULT '',
    social_tiktok TEXT DEFAULT '',
    social_twitter TEXT DEFAULT '',
    social_whatsapp TEXT DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- التأكد من وجود سجل واحد فقط للإعدادات
INSERT INTO app_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- تمكين المزامنة اللحظية (Realtime) لجدول الإعدادات
ALTER PUBLICATION supabase_realtime ADD TABLE app_settings;
