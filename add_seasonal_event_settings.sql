-- إضافة أعمدة التحكم بالمواسم والاحتفالات إلى جدول app_settings
ALTER TABLE app_settings
ADD COLUMN IF NOT EXISTS event_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS event_preset TEXT DEFAULT 'saudi_national_day',
ADD COLUMN IF NOT EXISTS event_title TEXT DEFAULT 'اليوم الوطني السعودي 94 🇸🇦',
ADD COLUMN IF NOT EXISTS event_subtitle TEXT DEFAULT 'نحتفل معكم باليوم الوطني 94! استمتع بأشهر الأطباق بخصم خاص',
ADD COLUMN IF NOT EXISTS event_promo_code TEXT DEFAULT 'SAUDI94',
ADD COLUMN IF NOT EXISTS event_banner_url TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS event_show_confetti BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS event_show_modal BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS event_accent_color TEXT DEFAULT '#16a34a',
ADD COLUMN IF NOT EXISTS event_secondary_color TEXT DEFAULT '#eab308';
