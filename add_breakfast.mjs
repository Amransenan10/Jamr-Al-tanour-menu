import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({path: '.env'});

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("Missing credentials in .env");
    process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);

const CATEGORY_ID = 'b0888888-8888-8888-8888-888888888888'; // Custom ID for Breakfast

const products = [
    { name_ar: 'ساندوتش كبده', price: 6, desc_ar: 'كبدة غنم نعيمي فريش' },
    { name_ar: 'صاروخ كبده', price: 12, desc_ar: 'كبدة غنم نعيمي فريش' },
    { name_ar: 'صحن كبده', price: 18, desc_ar: 'كبدة غنم نعيمي فريش' },
    { name_ar: 'صحن فلافل مع البيض', price: 7, desc_ar: '' },
    { name_ar: 'صحن فلافل بدون بيض', price: 6, desc_ar: '' },
    { name_ar: 'ساندوتش شكشوكه', price: 6, desc_ar: '' },
    { name_ar: 'ساندوتش بطاطس', price: 6, desc_ar: '' },
    { name_ar: 'ساندوتش بيض مقلي', price: 6, desc_ar: '' }
];

async function run() {
    try {
        console.log('1. Checking/Creating Category "الفطور"...');
        const { error: catError } = await supabaseAdmin.from('categories').upsert({
            id: CATEGORY_ID,
            name_ar: 'الفطور',
            name_en: 'Breakfast',
            display_order: 90,
            sort_order: 0,
            is_active: true
        });
        
        if (catError) throw catError;
        
        console.log('2. Inserting Products...');
        for(const p of products) {
            const { error: pError } = await supabaseAdmin.from('products').insert({
                id: crypto.randomUUID(),
                category_id: CATEGORY_ID,
                name_ar: p.name_ar,
                name_en: '',
                description_ar: p.desc_ar,
                description_en: '',
                price: p.price,
                image_url: null, // No images provided yet
                is_available: true
            });
            
            if (pError) {
                console.error(`Error adding ${p.name_ar}:`, pError);
            } else {
                console.log(`✅ Added: ${p.name_ar} - ${p.price} SAR`);
            }
        }
        
        console.log('Done!');
    } catch (e) {
        console.error('Error:', e);
    }
}

run();
