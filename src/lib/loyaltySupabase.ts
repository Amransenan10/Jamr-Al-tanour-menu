import { createClient } from '@supabase/supabase-js';

const loyaltyUrl = import.meta.env.VITE_SUPABASE_URL;
const loyaltyAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const loyaltyServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// For public queries from the Menu (read points only)
export const supabaseLoyalty = (loyaltyUrl && loyaltyAnonKey) 
  ? createClient(loyaltyUrl, loyaltyAnonKey) 
  : null;

// For secure updates from the Cashier (increment/decrement points)
export const supabaseLoyaltyAdmin = (loyaltyUrl && loyaltyServiceKey) 
  ? createClient(loyaltyUrl, loyaltyServiceKey) 
  : null;
