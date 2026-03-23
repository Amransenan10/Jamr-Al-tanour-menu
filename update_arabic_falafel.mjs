import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import sharp from 'sharp';
import { Buffer } from 'node:buffer';
dotenv.config({path: '.env'});

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const item = {
    name_ar: 'بوكس فلافل عربي',
    driveId: '1eeteBaoUk5_ftVuAcbRvtrgJwiVBIb_1',
    targetName: 'arabic_falafel_box_v2.jpg'
};

async function updateImage() {
    const driveUrl = `https://lh3.googleusercontent.com/d/${item.driveId}`;
    try {
        console.log(`Processing ${item.name_ar}...`);
        const res = await fetch(driveUrl);
        if (!res.ok) throw new Error('Download failed');
        const buffer = Buffer.from(await res.arrayBuffer());

        console.log('Optimizing...');
        const optimized = await sharp(buffer)
            .resize({ width: 1000, withoutEnlargement: true })
            .jpeg({ quality: 80, progressive: true })
            .toBuffer();

        console.log('Uploading...');
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

        if (!uploadRes.ok) throw new Error(await uploadRes.text());
        
        const publicUrl = `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${item.targetName}`;
        console.log(`URL: ${publicUrl}`);

        console.log('Updating DB...');
        // Use ilike for flex matching if needed, but exact eq is safer if name is known
        const { error } = await supabase.from('products').update({ image_url: publicUrl }).ilike('name_ar', `%${item.name_ar}%`);
        if (error) throw error;
        console.log(`✅ Success for ${item.name_ar}`);
    } catch (e) {
        console.error(`❌ Error for ${item.name_ar}: ${e.message}`);
    }
}

updateImage();
