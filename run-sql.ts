import { createClient } from '@supabase/supabase-js';  
import * as dotenv from 'dotenv';  
dotenv.config({path: '.env.local'});  
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);  
async function run() {  
const {error} = await supabase.rpc('execute_sql', { sql_query: CREATE TABLE IF NOT EXISTS promo_codes ( code TEXT PRIMARY KEY, discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')), discount_value NUMERIC NOT NULL, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW(), expiry_date TIMESTAMPTZ ); INSERT INTO promo_codes (code, discount_type, discount_value) VALUES ('JAMR10', 'percentage', 10), ('WELCOME', 'fixed', 15) ON CONFLICT (code) DO NOTHING; ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC DEFAULT 0, ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0, ADD COLUMN IF NOT EXISTS promo_code TEXT; });  
console.log('ERROR:', error); }  
run();  
