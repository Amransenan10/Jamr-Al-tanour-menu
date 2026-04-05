import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function listPolicies() {
  console.log('Fetching RLS policies...');
  const { data, error } = await supabaseAdmin
    .from('pg_policies')
    .select('schemaname, tablename, policyname, roles, cmd, qual')
    .order('schemaname', { ascending: true })
    .order('tablename', { ascending: true });

  if (error) {
    console.error('Error fetching policies:', error.message);
    return;
  }
  console.table(data);
}

listPolicies();
