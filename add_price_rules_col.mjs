import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({path: '.env'});
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const {error} = await supabase.rpc('execute_sql', { sql_query: `
    ALTER TABLE option_items ADD COLUMN IF NOT EXISTS price_rules JSONB;
  ` });
  console.log('ALTER RESULT:', error ? error : 'SUCCESS');
  
  // Try to set some default rules based on user request names
  // Pizza cheese
  const {error: e1} = await supabase.rpc('execute_sql', { sql_query: `
    UPDATE option_items SET price_rules = '{"صغير": 3, "وسط": 4, "كبير": 5}'::jsonb WHERE name_ar = 'أطراف جبنة' OR name_ar = 'اطراف جبن' OR name_ar = 'أطراف جبن' OR name_ar LIKE '%أطراف جبن%';
  ` });
  console.log('PIZZA RULE UPDATE:', e1 ? e1 : 'SUCCESS');

  // Shawarma cheese
  const {error: e2} = await supabase.rpc('execute_sql', { sql_query: `
    UPDATE option_items SET price_rules = '{"صغير": 1, "عادي": 1, "صاروخ": 2}'::jsonb WHERE name_ar = 'إضافة جبنة' OR name_ar = 'إضافة جبن' OR name_ar = 'اضافة جبنة' OR name_ar = 'اضافة جبن' OR name_ar = 'زيادة جبن';
  ` });
  console.log('SHAWARMA RULE UPDATE:', e2 ? e2 : 'SUCCESS');
}
run();
