import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const anonClient = createClient(SUPABASE_URL, ANON_KEY);
const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);

// الجداول المهمة للمنيو
const tables = ['categories', 'products', 'menu_items', 'store_settings', 'option_groups', 'option_items'];

console.log('\n=== فحص الـ ANON KEY (كيف يراها الموقع) ===');
for (const table of tables) {
  const { data, error } = await anonClient.from(table).select('id').limit(2);
  if (error) {
    console.log(`❌ ${table}: ${error.message}`);
  } else {
    console.log(`✅ ${table}: يعود ${data.length} صف`);
  }
}

console.log('\n=== فحص الـ ADMIN KEY ===');
for (const table of tables) {
  const { data, error } = await adminClient.from(table).select('id').limit(2);
  if (error) {
    console.log(`❌ ADMIN ${table}: ${error.message}`);
  } else {
    console.log(`✅ ADMIN ${table}: يعود ${data.length} صف`);
  }
}

console.log('\n=== إصلاح RLS - إضافة سياسات القراءة العامة ===');
const fixSQL = `
-- تفعيل RLS وإضافة سياسات القراءة للجداول الرئيسية
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['categories', 'products', 'store_settings', 'option_groups', 'option_items']
  LOOP
    -- حذف السياسات القديمة إن وجدت
    EXECUTE format('DROP POLICY IF EXISTS "allow_anon_read" ON %I', tbl);
    -- إضافة سياسة جديدة
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('CREATE POLICY "allow_anon_read" ON %I FOR SELECT TO anon, authenticated USING (true)', tbl);
  END LOOP;
END $$;
`;

const { error: fixError } = await adminClient.rpc('exec_sql', { sql: fixSQL }).select();
if (fixError) {
  console.log('⚠️  RPC غير متاحة، سيتم استخدام طريقة بديلة...');
  
  // Try direct table-by-table approach
  const policyTables = ['categories', 'products', 'store_settings'];
  for (const table of policyTables) {
    const { error } = await adminClient.from(table).select('id').limit(1);
    if (!error) {
      console.log(`✅ ${table}: قابل للقراءة من admin`);
    }
  }
  
  console.log('\n📋 يرجى تشغيل هذا SQL في Supabase SQL Editor:');
  console.log('-------------------------------------------');
  console.log(`
-- افتح: https://supabase.com/dashboard/project/hkkgolabztqgoxjnbqpe/sql/new
-- ثم الصق واضغط Run:

CREATE POLICY IF NOT EXISTS "Public read categories" ON categories FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Public read products" ON products FOR SELECT TO anon USING (true);  
CREATE POLICY IF NOT EXISTS "Public read store_settings" ON store_settings FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Public read option_groups" ON option_groups FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Public read option_items" ON option_items FOR SELECT TO anon USING (true);
  `);
} else {
  console.log('✅ تم إصلاح RLS بنجاح!');
}
