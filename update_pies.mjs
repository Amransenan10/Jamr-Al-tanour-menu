import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import sharp from 'sharp';
import { Buffer } from 'node:buffer';
dotenv.config({path: '.env'});

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const updates = [
    { name_ar: 'جبنة فيتا', driveId: '1PszFMSbc4PstZu1PP0OqAU1X2Kvy5pbE', targetName: 'feta_cheese_v2.jpg' },
    { name_ar: 'بطاطس سائل', driveId: '1BNxqPdfvUWBF92pQ-A-Zb_uEAN_zJ0pZ', targetName: 'potato_cheese_v2.jpg' },
    { name_ar: 'اجبان مشكلة', driveId: '1yJgdrE1ILdGDkYUKVbanQo_6D_mFje_e', targetName: 'mixed_cheese_v2.jpg' },
    { name_ar: 'لحم سائل', driveId: '1CqxYrqiizXjQcnebH99thNPtRUGI6otL', targetName: 'liquid_meat_v2.jpg' },
    { name_ar: 'محمرة سائل', driveId: '1Lih6xoVAnDd3rAO97w5wf8CBAvMV12uO', targetName: 'muhammara_liquid_v2.jpg' },
    { name_ar: 'دجاج سائل', driveId: '1qbZUj8PVeGu_bYmeYqvLJOTxfrX5r7SX', targetName: 'chicken_liquid_v2.jpg' },
    { name_ar: 'لوتس', driveId: '1lDYbkkyudinUiSiiWTN_meo1F-3dWp_K', targetName: 'lotus_v2.jpg' },
    { name_ar: 'عرايس قشقوان', driveId: '1Lgo1l_QEK1EtttIW4195SDiMK1JYscmm', targetName: 'arayes_kashkaval_v2.jpg' }
];

async function updateImage(item) {
    const driveUrl = `https://lh3.googleusercontent.com/d/${item.driveId}`;
    try {
        console.log(`Processing ${item.name_ar}...`);
        const res = await fetch(driveUrl);
        if (!res.ok) throw new Error('Download failed');
        const buffer = Buffer.from(await res.arrayBuffer());

        const optimized = await sharp(buffer)
            .resize({ width: 1000, withoutEnlargement: true })
            .jpeg({ quality: 80, progressive: true })
            .toBuffer();

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

        const { error } = await supabase.from('products').update({ image_url: publicUrl }).ilike('name_ar', `%${item.name_ar}%`);
        if (error) throw error;
        console.log(`✅ Success for ${item.name_ar}`);
    } catch (e) {
        console.error(`❌ Error for ${item.name_ar}: ${e.message}`);
    }
}

async function main() {
    for (const item of updates) {
        await updateImage(item);
    }
    console.log('Pie Category Batch Completed!');
}

main();
