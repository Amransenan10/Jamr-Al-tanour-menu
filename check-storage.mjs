import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({path: '.env'});

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
    const { data, error } = await supabase.storage.from('product-images').list();
    if (error) {
        console.error('Error listing bucked:', error);
        return;
    }
    
    console.log('--- Files in product-images ---');
    data.forEach(file => {
        console.log(`${file.name} - ${Math.round(file.metadata.size / 1024)} KB`);
    });
}

main();
