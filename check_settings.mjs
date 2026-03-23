import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({path: '.env'});

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkSettings() {
    try {
        const { data, error } = await supabase.from('store_settings').select('*');
        if (error) throw error;
        console.log('Store Settings:', data);
    } catch (e) {
        console.error('Error fetching settings:', e.message);
    }
}

checkSettings();
