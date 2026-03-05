import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function convertLinks() {
    console.log("Fetching products with google drive images...");

    const { data: products, error } = await supabase
        .from('products')
        .select('id, name_ar, image_url')
        .not('image_url', 'is', null)
        .like('image_url', '%drive.google.com%');

    if (error) {
        console.error("Error fetching:", error);
        return;
    }

    console.log(`Found ${products.length} products to update.`);
    let successCount = 0;

    for (const p of products) {
        // Extract ID from the old url format:
        // https://drive.google.com/uc?export=view&id=1pr2zNix1jiQwC94-S0kuKdTEsRUctlgD
        const match = p.image_url.match(/id=([^&]+)/);
        if (match && match[1]) {
            const fileId = match[1];
            // Use the working format: https://lh3.googleusercontent.com/d/FILE_ID
            const newUrl = `https://lh3.googleusercontent.com/d/${fileId}`;

            const { error: updateError } = await supabase
                .from('products')
                .update({ image_url: newUrl })
                .eq('id', p.id);

            if (updateError) {
                console.error(`Error updating ${p.name_ar}:`, updateError);
            } else {
                successCount++;
            }
        }
    }

    console.log(`Successfully updated ${successCount} links to new format.`);
}

convertLinks();
