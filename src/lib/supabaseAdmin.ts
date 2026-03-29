import { createClient } from '@supabase/supabase-js';

// This client uses the service_role key to bypass RLS on admin operations.
// ONLY use this inside password-protected admin pages.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = createClient(
  supabaseUrl || '',
  supabaseServiceRoleKey || ''
);
