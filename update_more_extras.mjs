import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import sharp from 'sharp';
import { Buffer } from 'node:buffer';
dotenv.config({path: '.env'});

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const items = [
    {
        name_ar: 'ملفوف محشي',
        driveId: '1LhZcb9MB0dqdCX5Asj7UICncT6ING892',
        targetName: 'stuffed_cabbage_v2.jpg'
    },
    {
        name_ar: 'صحن بطاطس مقلي مع بهارات',
        driveId: '1xZ3qAf346iVRh0xtmNfGg2JYX1H7mU6P',
        targetName: 'spiced_fries_v2.jpg'
    }
];

async function updateItems() {
    for (const item of items) {
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
            const { error } = await supabase.from('products').update({ image_url: publicUrl }).ilike('name_ar', `%${item.name_ar}%`);
            if (error) throw error;
            console.log(`✅ Success for ${item.name_ar}`);
        } catch (e) {
            console.error(`❌ Error for ${item.name_ar}: ${e.message}`);
        }
    }
}

updateItems();
