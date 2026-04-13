import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config({path: '.env'});
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const sql = fs.readFileSync('stories_migration.sql', 'utf8');
  const {error} = await supabase.rpc('execute_sql', { sql_query: sql });
  if (error) {
    console.log('ERROR:', error);
  } else {
    console.log('Migration completed successfully!');
  }
}
run();
