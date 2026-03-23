import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import sharp from 'sharp';
import { Buffer } from 'node:buffer';
dotenv.config({path: '.env'});

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
    const driveId = '1nF4ymLFK8s0VoJ47zuxBHJLYG7r2EfFC';
    const targetName = 'strips_meal.jpg';
    const productName = 'وجبة استربس';
    const driveUrl = `https://drive.usercontent.google.com/download?id=${driveId}&export=download`;

    try {
        console.log(`Downloading image from Drive...`);
        const res = await fetch(driveUrl);
        if (!res.ok) throw new Error('Download failed');
        const buffer = Buffer.from(await res.arrayBuffer());

        console.log(`Optimizing image...`);
        const optimized = await sharp(buffer)
            .resize({ width: 1000, withoutEnlargement: true })
            .jpeg({ quality: 80, progressive: true })
            .toBuffer();

        console.log(`Uploading to Supabase...`);
        const uploadRes = await fetch(`${process.env.VITE_SUPABASE_URL}/storage/v1/object/product-images/${targetName}`, {
            method: 'POST',
            headers: {
                'apikey': process.env.VITE_SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
                'Content-Type': 'image/jpeg',
                'x-upsert': 'true'
            },
            body: optimized
        });

        if (!uploadRes.ok) throw new Error(await uploadRes.text());
        
        const publicUrl = `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${targetName}`;
        console.log(`Image URL: ${publicUrl}`);

        console.log(`Updating database for '${productName}'...`);
        const { error } = await supabase.from('products').update({ image_url: publicUrl }).eq('name_ar', productName);
        
        if (error) throw error;
        console.log('✅ Done!');
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
}

main();
