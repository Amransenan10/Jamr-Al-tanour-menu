import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const admin = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log('Attempting to add column "pickup_time" to table "orders" and reloading schema cache...');
  
  const { data, error } = await admin.rpc('execute_sql', {
    sql_query: `
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_time TEXT;
      NOTIFY pgrst, 'reload schema';
    `
  });

  if (error) {
    console.error('Migration failed via execute_sql:', error);
    process.exit(1);
  } else {
    console.log('Migration successful! Column "pickup_time" has been added and schema cache reloaded.', data);
    process.exit(0);
  }
}

run();
