import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({path: '.env'});
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const {data, error} = await supabase.from('option_items').select('price_rules').limit(1);
  console.log("Column exists?", !error);
  if (error) console.log(error.message);
}
run();
