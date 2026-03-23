import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({path: '.env'});

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
    console.log('Fetching files from product-images bucket...');
    const { data: files, error: storageError } = await supabase.storage.from('product-images').list('', { limit: 1000 });
    if (storageError) {
        console.error('Error listing storage:', storageError);
        return;
    }

    console.log(`Found ${files.length} files in storage.`);
    
    console.log('Fetching products with null image_url...');
    const { data: products, error: dbError } = await supabase
        .from('products')
        .select('id, name_ar')
        .is('image_url', null);
    
    if (dbError) {
        console.error('Error fetching products:', dbError);
        return;
    }

    console.log(`Found ${products.length} products with null image_url.`);

    let updateCount = 0;
    for (const product of products) {
        const matchingFile = files.find(f => f.name === `${product.id}.jpg` || f.name.toLowerCase() === `${product.id}.jpg`.toLowerCase());
        
        if (matchingFile) {
            const publicUrl = `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${matchingFile.name}`;
            console.log(`Linking ${product.name_ar} to ${publicUrl}`);
            
            const { error: updateError } = await supabase
                .from('products')
                .update({ image_url: publicUrl })
                .eq('id', product.id);
            
            if (updateError) {
                console.error(`Failed to update ${product.name_ar}:`, updateError);
            } else {
                updateCount++;
            }
        }
    }

    console.log(`Successfully linked ${updateCount} products.`);
}

main();
