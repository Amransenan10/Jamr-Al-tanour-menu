import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({path: '.env'});

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const targetName = 'بوكس مميز';
const newDescriptionAr = 'ملفوف + كبه + ورق عنب';
const newDescriptionEn = 'Cabbage + Kibbeh + Grape Leaves';

async function updateDescription() {
    try {
        console.log(`Updating description for ${targetName}...`);
        const { data, error } = await supabase
            .from('products')
            .update({ 
                description_ar: newDescriptionAr,
                description_en: newDescriptionEn
            })
            .ilike('name_ar', `%${targetName}%`)
            .select();

        if (error) throw error;
        if (data && data.length > 0) {
            console.log(`✅ Successfully updated ${data.length} products.`);
            console.log('Updated Data:', data);
        } else {
            console.log('⚠️ No product found with that name.');
        }
    } catch (e) {
        console.error(`❌ Error updating description: ${e.message}`);
    }
}

updateDescription();
