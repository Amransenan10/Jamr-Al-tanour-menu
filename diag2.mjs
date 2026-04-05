import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { writeFileSync } from 'fs';
dotenv.config();

const anon = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const admin = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

const lines = [];
lines.push('URL: ' + (process.env.VITE_SUPABASE_URL ? 'OK' : 'MISSING'));
lines.push('ANON: ' + (process.env.VITE_SUPABASE_ANON_KEY ? 'OK' : 'MISSING'));
lines.push('');
lines.push('=== ANON (كيف يراها الموقع) ===');

const tables = ['categories','products','menu_items','store_settings','option_groups','option_items'];

for(const t of tables){
  const {data,error} = await anon.from(t).select('id').limit(1);
  lines.push(error ? `FAIL ${t}: ${error.message}` : `OK   ${t}: ${data.length} rows`);
}

lines.push('');
lines.push('=== ADMIN ===');
for(const t of tables){
  const {data,error} = await admin.from(t).select('id').limit(1);
  lines.push(error ? `FAIL ${t}: ${error.message}` : `OK   ${t}: ${data.length} rows`);
}

const result = lines.join('\n');
writeFileSync('diag_result.txt', result);
console.log(result);
