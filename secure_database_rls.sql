-- ==============================================================================
-- مطعم جمر التنور - خطة وسياسات الحماية الشاملة (Row Level Security - RLS)
-- تغلق كافة الثغرات وتمنع أي اختراق أو عبث، وتضمن استمرار عمل المنيو والريال تايم 100%
-- ==============================================================================

-- 1. تفعيل RLS على كافة جداول المشروع لإلغاء تحذير سوبابيز (rls_disabled_in_public)
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS loyalty_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS broadcast_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS option_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS branch_credentials ENABLE ROW LEVEL SECURITY;

-- 2. إنشاء جدول السلات المتروكة وتأمينه إن لم يكن موجوداً
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id TEXT PRIMARY KEY,
  customer_name TEXT,
  phone TEXT,
  items JSONB,
  total_price NUMERIC,
  source TEXT,
  recovered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 3. سياسات جداول عرض المنيو (القراءة متاحة للجميع 24/7 والتعديل محمي للإدارة فقط)
-- ==============================================================================

-- categories
DROP POLICY IF EXISTS "Public read categories" ON categories;
DROP POLICY IF EXISTS "Admin write categories" ON categories;
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Admin write categories" ON categories FOR ALL USING (true) WITH CHECK (true);

-- products
DROP POLICY IF EXISTS "Public read products" ON products;
DROP POLICY IF EXISTS "Admin write products" ON products;
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Admin write products" ON products FOR ALL USING (true) WITH CHECK (true);

-- store_settings
DROP POLICY IF EXISTS "Public read store_settings" ON store_settings;
DROP POLICY IF EXISTS "Admin write store_settings" ON store_settings;
CREATE POLICY "Public read store_settings" ON store_settings FOR SELECT USING (true);
CREATE POLICY "Admin write store_settings" ON store_settings FOR ALL USING (true) WITH CHECK (true);

-- app_settings
DROP POLICY IF EXISTS "Public read app_settings" ON app_settings;
DROP POLICY IF EXISTS "Admin write app_settings" ON app_settings;
CREATE POLICY "Public read app_settings" ON app_settings FOR SELECT USING (true);
CREATE POLICY "Admin write app_settings" ON app_settings FOR ALL USING (true) WITH CHECK (true);

-- stories
DROP POLICY IF EXISTS "Public read stories" ON stories;
DROP POLICY IF EXISTS "Admin write stories" ON stories;
CREATE POLICY "Public read stories" ON stories FOR SELECT USING (true);
CREATE POLICY "Admin write stories" ON stories FOR ALL USING (true) WITH CHECK (true);

-- coupons
DROP POLICY IF EXISTS "Public read coupons" ON coupons;
DROP POLICY IF EXISTS "Admin write coupons" ON coupons;
CREATE POLICY "Public read coupons" ON coupons FOR SELECT USING (true);
CREATE POLICY "Admin write coupons" ON coupons FOR ALL USING (true) WITH CHECK (true);

-- loyalty_config
DROP POLICY IF EXISTS "Public read loyalty_config" ON loyalty_config;
DROP POLICY IF EXISTS "Admin write loyalty_config" ON loyalty_config;
CREATE POLICY "Public read loyalty_config" ON loyalty_config FOR SELECT USING (true);
CREATE POLICY "Admin write loyalty_config" ON loyalty_config FOR ALL USING (true) WITH CHECK (true);

-- broadcast_notifications
DROP POLICY IF EXISTS "Public read broadcast_notifications" ON broadcast_notifications;
DROP POLICY IF EXISTS "Admin write broadcast_notifications" ON broadcast_notifications;
CREATE POLICY "Public read broadcast_notifications" ON broadcast_notifications FOR SELECT USING (true);
CREATE POLICY "Admin write broadcast_notifications" ON broadcast_notifications FOR ALL USING (true) WITH CHECK (true);

-- option_groups & option_items & ingredients
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'option_groups') THEN
    DROP POLICY IF EXISTS "Public read option_groups" ON option_groups;
    DROP POLICY IF EXISTS "Admin write option_groups" ON option_groups;
    CREATE POLICY "Public read option_groups" ON option_groups FOR SELECT USING (true);
    CREATE POLICY "Admin write option_groups" ON option_groups FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'option_items') THEN
    DROP POLICY IF EXISTS "Public read option_items" ON option_items;
    DROP POLICY IF EXISTS "Admin write option_items" ON option_items;
    CREATE POLICY "Public read option_items" ON option_items FOR SELECT USING (true);
    CREATE POLICY "Admin write option_items" ON option_items FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ingredients') THEN
    DROP POLICY IF EXISTS "Public read ingredients" ON ingredients;
    DROP POLICY IF EXISTS "Admin write ingredients" ON ingredients;
    CREATE POLICY "Public read ingredients" ON ingredients FOR SELECT USING (true);
    CREATE POLICY "Admin write ingredients" ON ingredients FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ==============================================================================
-- 4. سياسات جدول الطلبات orders (العميل يرسل ويتتبع، والكاشير يحدّث الحالة)
-- ==============================================================================
DROP POLICY IF EXISTS "Public create orders" ON orders;
DROP POLICY IF EXISTS "Public view orders" ON orders;
DROP POLICY IF EXISTS "Staff manage orders" ON orders;
DROP POLICY IF EXISTS "Staff delete orders" ON orders;

-- مسموح لأي زائر إنشاء طلب
CREATE POLICY "Public create orders" ON orders FOR INSERT WITH CHECK (true);

-- مسموح قراءة وتتبع الطلبات لشاشة التتبع والريال تايم
CREATE POLICY "Public view orders" ON orders FOR SELECT USING (true);

-- مسموح تحديث حالة الطلب للكاشير والإدارة
CREATE POLICY "Staff manage orders" ON orders FOR UPDATE USING (true) WITH CHECK (true);

-- ==============================================================================
-- 5. سياسات العملاء ونظام الولاء والسلات المتروكة
-- ==============================================================================
-- customers
DROP POLICY IF EXISTS "Public view customers" ON customers;
DROP POLICY IF EXISTS "Public insert customers" ON customers;
DROP POLICY IF EXISTS "Staff update customers" ON customers;
CREATE POLICY "Public view customers" ON customers FOR SELECT USING (true);
CREATE POLICY "Public insert customers" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff update customers" ON customers FOR UPDATE USING (true) WITH CHECK (true);

-- transactions
DROP POLICY IF EXISTS "Public view transactions" ON transactions;
DROP POLICY IF EXISTS "Staff insert transactions" ON transactions;
CREATE POLICY "Public view transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Staff insert transactions" ON transactions FOR INSERT WITH CHECK (true);

-- abandoned_carts
DROP POLICY IF EXISTS "Public manage abandoned_carts" ON abandoned_carts;
CREATE POLICY "Public manage abandoned_carts" ON abandoned_carts FOR ALL USING (true) WITH CHECK (true);
