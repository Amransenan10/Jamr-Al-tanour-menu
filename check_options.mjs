import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({path: '.env'});
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const {data} = await supabase.from('option_groups').select('id, name_ar').ilike('name_ar', '%اطراف%');
  console.log("Crust groups:", data);
  const {data: items} = await supabase.from('option_items').select('id, name_ar').ilike('name_ar', '%جبن%');
  console.log("Cheese items:", items);
}
run();
