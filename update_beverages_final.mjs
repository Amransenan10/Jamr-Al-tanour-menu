import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import sharp from 'sharp';
import { Buffer } from 'node:buffer';
dotenv.config({path: '.env'});

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const updates = [
    { name_ar: 'كوكاكولا', driveId: '1hHyAWtyJrkZU6Rsr8_-px_Bq_-r4ad4w', target: 'cola_can_v3.jpg' },
    { name_ar: 'سبرايت', driveId: '1DMk0wEWOcswKhPLTlQZUCy0vVxINw5jt', target: 'sprite_can_v3.jpg' },
    { name_ar: 'حمضيات', driveId: '1eowfYqOHASdXyLmTM0EQfpVsIERIh0Zy', target: 'citrus_can_v3.jpg' },
    { name_ar: 'كينزا', driveId: '1GmoX11LrLCcfbVPTEIqyuMrS0mrn8t4Z', target: 'kinza_v3.jpg' },
    { name_ar: 'كولا لتر', driveId: '1ZT1a1Mn81dqzQfzthp0Fd7aHMVzxkdgH', target: 'cola_1liter_v3.jpg' }
];

async function updateImage(item) {
    // Using lh3 to get JPEG directly from HEIC sources
    const driveUrl = `https://lh3.googleusercontent.com/d/${item.driveId}`;
    try {
        console.log(`Processing ${item.name_ar}...`);
        const res = await fetch(driveUrl);
        if (!res.ok) throw new Error(`Download failed`);
        const buffer = Buffer.from(await res.arrayBuffer());

        console.log(`Optimizing with sharp...`);
        const optimized = await sharp(buffer)
            .resize({ width: 1000, withoutEnlargement: true })
            .jpeg({ quality: 80, progressive: true })
            .toBuffer();

        const uploadPath = `product-images/${item.target}`;
        console.log(`Uploading to ${uploadPath}...`);
        const uploadRes = await fetch(`${process.env.VITE_SUPABASE_URL}/storage/v1/object/${uploadPath}`, {
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
        
        const publicUrl = `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public/${uploadPath}`;
        
        // Update DB - search by name_ar
        console.log(`Updating DB...`);
        const { data, error } = await supabase
            .from('products')
            .update({ image_url: publicUrl })
            .ilike('name_ar', `%${item.name_ar}%`);
        
        if (error) throw error;
        console.log(`✅ ${item.name_ar} success!`);
    } catch (e) {
        console.error(`❌ ${item.name_ar}: ${e.message}`);
    }
}

async function main() {
    for (const item of updates) {
        await updateImage(item);
    }
    console.log('Final Batch Completed!');
}

main();
