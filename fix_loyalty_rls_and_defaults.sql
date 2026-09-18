-- ======================================================
-- 1. تحديث الجدول والقيم الافتراضية بنسب الولاء الجديدة:
-- 1 ريال = 1 نقطة (earning_rate = 1)
-- 10 نقاط = 1 ريال خصم (redemption_rate = 10)
-- ======================================================

ALTER TABLE IF EXISTS loyalty_config 
    ALTER COLUMN earning_rate SET DEFAULT 1,
    ALTER COLUMN redemption_rate SET DEFAULT 10;

-- تحديث السجل الموجود في الجدول بالقيم الجديدة
INSERT INTO loyalty_config (id, is_enabled, earning_rate, redemption_rate, min_points_to_redeem, welcome_bonus_points)
VALUES (1, true, 1, 10, 5, 0)
ON CONFLICT (id) DO UPDATE SET 
    earning_rate = 1,
    redemption_rate = 10,
    updated_at = NOW();

-- ======================================================
-- 2. فتح صلاحيات RLS للرفع والتعديل على جدول loyalty_config و customers و transactions
-- لضمان عمل زر الحفظ وحفظ البيانات بدون رفض من السوبابيز
-- ======================================================

-- تمكين RLS
ALTER TABLE loyalty_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- سياسات loyalty_config
DROP POLICY IF EXISTS "Public read loyalty_config" ON loyalty_config;
DROP POLICY IF EXISTS "Public write loyalty_config" ON loyalty_config;
DROP POLICY IF EXISTS "Public update loyalty_config" ON loyalty_config;
DROP POLICY IF EXISTS "Public all loyalty_config" ON loyalty_config;

CREATE POLICY "Public all loyalty_config" ON loyalty_config 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- سياسات customers
DROP POLICY IF EXISTS "Public read customers" ON customers;
DROP POLICY IF EXISTS "Public write customers" ON customers;
DROP POLICY IF EXISTS "Public all customers" ON customers;

CREATE POLICY "Public all customers" ON customers 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- سياسات transactions
DROP POLICY IF EXISTS "Public read transactions" ON transactions;
DROP POLICY IF EXISTS "Public write transactions" ON transactions;
DROP POLICY IF EXISTS "Public all transactions" ON transactions;

CREATE POLICY "Public all transactions" ON transactions 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);
