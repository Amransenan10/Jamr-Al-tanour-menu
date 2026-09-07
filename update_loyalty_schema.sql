-- 1. جدول العملاء (Customers)
CREATE TABLE IF NOT EXISTS customers (
    phone_number TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    points_balance INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. جدول حركات النقاط والمعاملات (Transactions)
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    customer_phone TEXT REFERENCES customers(phone_number) ON DELETE CASCADE,
    type TEXT DEFAULT 'earn', -- 'earn', 'redeem', 'admin_add', 'admin_deduct'
    amount NUMERIC DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    points_redeemed INTEGER DEFAULT 0,
    notes TEXT,
    staff_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. جدول إعدادات نظام الولاء (Loyalty Config)
CREATE TABLE IF NOT EXISTS loyalty_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    is_enabled BOOLEAN DEFAULT true,
    earning_rate NUMERIC DEFAULT 10, -- كم ريال = 1 نقطة
    redemption_rate NUMERIC DEFAULT 5, -- كم نقطة = 1 ريال خصم
    min_points_to_redeem INTEGER DEFAULT 5, -- الحد الأدنى للاستبدال
    welcome_bonus_points INTEGER DEFAULT 0, -- نقاط ترحيبية للعميل الجديد
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إدراج صف الإعدادات الافتراضي إن لم يكن موجوداً
INSERT INTO loyalty_config (id, is_enabled, earning_rate, redemption_rate, min_points_to_redeem, welcome_bonus_points) 
VALUES (1, true, 10, 5, 5, 0) 
ON CONFLICT (id) DO NOTHING;

-- التأكد من وجود جميع الأعمدة الجديدة عند وجود الجداول مسبقاً
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loyalty_config' AND column_name = 'is_enabled') THEN
        ALTER TABLE loyalty_config ADD COLUMN is_enabled BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loyalty_config' AND column_name = 'min_points_to_redeem') THEN
        ALTER TABLE loyalty_config ADD COLUMN min_points_to_redeem INTEGER DEFAULT 5;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loyalty_config' AND column_name = 'welcome_bonus_points') THEN
        ALTER TABLE loyalty_config ADD COLUMN welcome_bonus_points INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'type') THEN
        ALTER TABLE transactions ADD COLUMN type TEXT DEFAULT 'earn';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'notes') THEN
        ALTER TABLE transactions ADD COLUMN notes TEXT;
    END IF;
END $$;

-- تمكين المزامنة اللحظية Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE customers;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE loyalty_config;

-- سياسات الأمان RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_config ENABLE ROW LEVEL SECURITY;

-- سياسات القراءة للجميع
DROP POLICY IF EXISTS "Public read customers" ON customers;
CREATE POLICY "Public read customers" ON customers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read transactions" ON transactions;
CREATE POLICY "Public read transactions" ON transactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read loyalty_config" ON loyalty_config;
CREATE POLICY "Public read loyalty_config" ON loyalty_config FOR SELECT USING (true);
