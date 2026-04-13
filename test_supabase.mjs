import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  try {
    const res = await supabase.from('not_exist_table_123').select('*').catch(e => { console.log('caught rejection!'); return {data: [], error: null} });
    console.log('resolved:', res);
  } catch (e) {
    console.log('caught error in try/catch:', e);
  }
}
test();
