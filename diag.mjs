import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const anon = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const admin = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

console.log('URL:', process.env.VITE_SUPABASE_URL ? 'موجود ✅' : 'مفقود ❌');
console.log('ANON KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'موجود ✅' : 'مفقود ❌');
console.log('');

const tables = ['categories','products','menu_items','store_settings','option_groups','option_items'];

console.log('=== ANON KEY (كيف يراها الموقع) ===');
for(const t of tables){
  const {data,error} = await anon.from(t).select('id').limit(1);
  if(error) {
    console.log(`❌ ${t}: ${error.message}`);
  } else {
    console.log(`✅ ${t}: OK (${data.length} rows)`);
  }
}

console.log('');
console.log('=== ADMIN KEY ===');
for(const t of tables){
  const {data,error} = await admin.from(t).select('id').limit(1);
  if(error) {
    console.log(`❌ ${t}: ${error.message}`);
  } else {
    console.log(`✅ ${t}: OK (${data.length} rows)`);
  }
}
