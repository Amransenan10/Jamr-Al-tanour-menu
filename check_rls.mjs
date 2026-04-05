import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function checkRLS() {
  console.log('Checking tables and RLS status...');
  // Note: We can only check this via SQL, and we need raw SQL execution.
  // Instead of raw SQL, we can test querying from anon key.
  const supabaseAnon = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  const tables = ['categories', 'menu_items', 'orders', 'users', 'discounts', 'categories_options', 'item_options', 'promo_codes'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabaseAnon.from(table).select('*').limit(1);
      if (error) {
        console.error(`[ANON] Error reading from ${table}:`, error.message);
      } else {
        console.log(`[ANON] Successfully read from ${table}. Returned ${data.length} rows.`);
      }
    } catch (e) {
      console.error(`Error querying ${table}:`, e);
    }
  }
}

checkRLS();
