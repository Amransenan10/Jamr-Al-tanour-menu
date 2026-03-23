import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import sharp from 'sharp';
import { Buffer } from 'node:buffer';
dotenv.config({path: '.env'});

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const updates = [
    {
        name_ar: 'جامبو استربس',
        driveId: '18-PEag2oYYDOnxd8Ak5QD9IDlG59hYgM',
        targetName: 'jumbo_strips.jpg'
    },
    {
        name_ar: 'صاروخ استربس',
        driveId: '1V37CaHKHEaDIs6XFawInthgWjpRDKtMy',
        targetName: 'rocket_strips.jpg'
    }
];

async function updateImage(item) {
    const driveUrl = `https://drive.usercontent.google.com/download?id=${item.driveId}&export=download`;
    try {
        console.log(`Processing ${item.name_ar}...`);
        console.log(`Downloading...`);
        const res = await fetch(driveUrl);
        if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);
        const buffer = Buffer.from(await res.arrayBuffer());

        console.log(`Optimizing...`);
        const optimized = await sharp(buffer)
            .resize({ width: 1000, withoutEnlargement: true })
            .jpeg({ quality: 80, progressive: true })
            .toBuffer();

        console.log(`Uploading...`);
        const uploadRes = await fetch(`${process.env.VITE_SUPABASE_URL}/storage/v1/object/product-images/${item.targetName}`, {
            method: 'POST',
            headers: {
                'apikey': process.env.VITE_SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
                'Content-Type': 'image/jpeg',
                'x-upsert': 'true'
            },
            body: optimized
        });

        if (!uploadRes.ok) throw new Error(`Upload failed: ${await uploadRes.text()}`);
        
        const publicUrl = `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${item.targetName}`;
        console.log(`URL: ${publicUrl}`);

        console.log(`Updating database...`);
        const { error } = await supabase.from('products').update({ image_url: publicUrl }).eq('name_ar', item.name_ar);
        
        if (error) throw error;
        console.log(`✅ Success for ${item.name_ar}`);
    } catch (e) {
        console.error(`❌ Error for ${item.name_ar}:`, e.message);
    }
}

async function main() {
    for (const item of updates) {
        await updateImage(item);
    }
    console.log('All done!');
}

main();
