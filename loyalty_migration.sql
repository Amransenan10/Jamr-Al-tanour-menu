-- 1. جدول العملاء (Customers) لربط النقاط برقم الجوال
CREATE TABLE IF NOT EXISTS customers (
    phone_number TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    points_balance INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. جدول معاملات النقاط (Transactions) لتتبع السجل
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    customer_phone TEXT REFERENCES customers(phone_number) ON DELETE CASCADE,
    amount NUMERIC DEFAULT 0, -- القيمة المالية للعملية
    points_earned INTEGER DEFAULT 0,
    points_redeemed INTEGER DEFAULT 0,
    staff_id TEXT, -- معرف الموظف الذي قام بالعملية (اختياري)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. جدول إعدادات نظام الولاء (Config)
CREATE TABLE IF NOT EXISTS loyalty_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    earning_rate NUMERIC DEFAULT 10, -- كل كم ريال نقطة (مثلاً 10 ريال = نقطة)
    redemption_rate NUMERIC DEFAULT 5, -- كل كم نقطة تساوي ريال خصم (مثلاً 5 نقاط = 1 ريال)
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إدراج الإعدادات الافتراضية
INSERT INTO loyalty_config (id, earning_rate, redemption_rate) 
VALUES (1, 10, 5) 
ON CONFLICT (id) DO NOTHING;

-- 4. تمكين المزامنة اللحظية (Realtime)
ALTER PUBLICATION supabase_realtime ADD TABLE customers;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE loyalty_config;

-- 5. إضافة سياسات الأمان (RLS) للوصول العام (للقراءة فقط)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read for points" ON customers FOR SELECT USING (true);

-- سياسة التحديث والإضافة مقتصرة على الـ Service Role عبر الـ Supabase Admin
