import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
    const productId = 'ccd5b56d-f4f8-495f-9691-441a3fda4dde'; // حمص
    const groupId = 'a0111111-2222-3333-4444-555555555555';
    const sql = `
    INSERT INTO public.option_groups (id, product_id, name_ar, name_en, min_selection, max_selection)
    VALUES ('${groupId}', '${productId}', 'الحجم', 'Size', 1, 1)
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO public.option_items (group_id, name_ar, name_en, price, is_available)
    VALUES 
    ('${groupId}', 'صغير', 'Small', 6, true),
    ('${groupId}', 'كبير', 'Large', 10, true);
  `;
    const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql });
    if (error) {
        console.error('RPC Error:', error);
    } else {
        console.log('RPC Success:', data);
    }
}
run();
