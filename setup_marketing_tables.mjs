import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function setupTables() {
  console.log('Setting up marketing and push tables...');

  // Try creating via RPC or fallback table check
  const sql = `
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      endpoint TEXT UNIQUE NOT NULL,
      keys JSONB,
      user_phone TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS broadcast_notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      url TEXT,
      promo_code TEXT,
      target_group TEXT DEFAULT 'all',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  try {
    const { error } = await supabase.rpc('execute_sql', { sql_query: sql });
    if (error) {
      console.log('RPC execute_sql returned error, testing direct table access:', error.message);
    } else {
      console.log('Successfully executed SQL via RPC');
    }
  } catch (err) {
    console.error('RPC Error:', err);
  }

  // Check if tables exist by querying them
  const { data: subData, error: subErr } = await supabase.from('push_subscriptions').select('id').limit(1);
  if (subErr && subErr.code === '42P01') {
    console.log('push_subscriptions table does not exist yet. Please run migration in Supabase SQL editor.');
  } else {
    console.log('push_subscriptions table ready!');
  }

  const { data: bData, error: bErr } = await supabase.from('broadcast_notifications').select('id').limit(1);
  if (bErr && bErr.code === '42P01') {
    console.log('broadcast_notifications table does not exist yet. Please run migration in Supabase SQL editor.');
  } else {
    console.log('broadcast_notifications table ready!');
  }
}

setupTables();
