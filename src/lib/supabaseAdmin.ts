import { createClient } from '@supabase/supabase-js';

// This client uses the service_role key to bypass RLS on admin operations.
// ONLY use this inside password-protected admin pages.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseServiceRoleKey) {
  console.warn('WARNING: VITE_SUPABASE_SERVICE_ROLE_KEY is missing. Admin operations will use anon key.');
}

export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseServiceRoleKey || supabaseAnonKey || 'placeholder-key'
);
