import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const admin = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("Testing execute_sql RPC call...");
  const { data, error } = await admin.rpc('execute_sql', {
    sql_query: 'SELECT 1 as test_val;'
  });
  if (error) {
    console.error('execute_sql RPC failed with error:');
    console.error(JSON.stringify(error, null, 2));
  } else {
    console.log('execute_sql RPC works! Result:', data);
  }
}
run();
