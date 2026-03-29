import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({path: '.env'});
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const {error: e1} = await supabase.rpc('execute_sql', { sql_query: `
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS is_delivery_active BOOLEAN DEFAULT true;
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS is_pickup_active BOOLEAN DEFAULT true;
    
    INSERT INTO branch_credentials (branch_name, password)
    VALUES ('admin', 'admin123')
    ON CONFLICT (branch_name) DO NOTHING;
  ` });
  console.log('ALTER RESULT:', e1 ? e1 : 'SUCCESS');
}
run();
