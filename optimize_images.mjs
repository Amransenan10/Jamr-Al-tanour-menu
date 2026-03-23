import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import sharp from 'sharp';
import { Buffer } from 'node:buffer';
dotenv.config({path: '.env'});

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function extractDriveId(url) {
  const match = url.match(/id=([a-zA-Z0-9_-]+)/) || url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function sanitizeName(name) {
  return (name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_أ-ي]/g, '') + '.jpg').toLowerCase();
}

async function optimizeAndUpload(sourceBuffer, targetName) {
    try {
        console.log(`Optimizing ${targetName}...`);
        // Radical Optimization: Resize to max 1000px and compress to small JPG
        const optimizedBuffer = await sharp(sourceBuffer)
            .resize({ width: 1000, withoutEnlargement: true })
            .jpeg({ quality: 75, progressive: true })
            .toBuffer();

        console.log(`Uploading optimized ${targetName} (${Math.round(optimizedBuffer.length / 1024)} KB)`);
        
        const uploadRes = await fetch(`${process.env.VITE_SUPABASE_URL}/storage/v1/object/product-images/${targetName}`, {
            method: 'POST',
            headers: {
                'apikey': process.env.VITE_SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
                'Content-Type': 'image/jpeg',
                'x-upsert': 'true'
            },
            body: optimizedBuffer
        });

        if (!uploadRes.ok) {
            console.error(`Upload failed for ${targetName}`, await uploadRes.text());
            return null;
        }

        return `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${targetName}`;
    } catch (e) {
        console.error(`Optimization error for ${targetName}:`, e);
        return null;
    }
}

async function downloadFromURL(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const arrayBuffer = await res.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (e) {
        return null;
    }
}

async function main() {
    // 1. Process Beverage Updates First (Prioritize High-Res from User)
    const beverageUpdates = [
        { name_ar: 'كوكاكولا', name_token: 'cola_can_hd.jpg', driveLink: 'https://drive.google.com/file/d/1hHyAWtyJrkZU6Rsr8_-px_Bq_-r4ad4w/view?usp=drivesdk' },
        { name_ar: 'سبرايت', name_token: 'sprite_can_hd.jpg', driveLink: 'https://drive.google.com/file/d/1DMk0wEWOcswKhPLTlQZUCy0vVxINw5jt/view?usp=drivesdk' },
        { name_ar: 'حمضيات', name_token: 'citrus_can_hd.jpg', driveLink: 'https://drive.google.com/file/d/1eowfYqOHASdXyLmTM0EQfpVsIERIh0Zy/view?usp=drivesdk' },
        { name_ar: 'كولا (١ لتر)', name_token: 'cola_1liter_hd.jpg', driveLink: 'https://drive.google.com/file/d/1ZT1a1Mn81dqzQfzthp0Fd7aHMVzxkdgH/view?usp=drivesdk' },
        { name_ar: 'كينزا', name_token: 'kinza_hd.jpg', driveLink: 'https://drive.google.com/file/d/1GmoX11LrLCcfbVPTEIqyuMrS0mrn8t4Z/view?usp=drivesdk' }
    ];

    console.log('--- Phase 1: High-Res Beverage Updates ---');
    for (const bev of beverageUpdates) {
        const driveId = extractDriveId(bev.driveLink);
        if (!driveId) continue;
        const downloadUrl = `https://drive.usercontent.google.com/download?id=${driveId}&export=download`;
        const buffer = await downloadFromURL(downloadUrl);
        if (buffer) {
            const newUrl = await optimizeAndUpload(buffer, bev.name_token);
            if (newUrl) {
                const { error } = await supabase.from('products').update({ image_url: newUrl }).eq('name_ar', bev.name_ar);
                console.log(error ? `DB Fail: ${bev.name_ar}` : `✅ HD Beverage Fixed: ${bev.name_ar}`);
            }
        } else {
            console.error(`❌ Could not download ${bev.name_ar} - Check if sharing is really ON.`);
        }
    }

    // 2. Process All Other Heavy Images in Database
    console.log('\n--- Phase 2: Radical Optimization for Heavy Images ---');
    const { data: products } = await supabase.from('products').select('*');
    if (!products) return;

    for (const product of products) {
        // Skip beverages we just did or products without valid external images
        if (beverageUpdates.some(b => b.name_ar === product.name_ar)) continue;
        if (!product.image_url) continue;

        // Check if it's already in Supabase but might be unoptimized
        const isSupabase = product.image_url.includes('supabase.co');
        const buffer = await downloadFromURL(product.image_url);
        
        if (buffer) {
            const targetName = sanitizeName(product.name_en || product.name_ar);
            const newUrl = await optimizeAndUpload(buffer, targetName);
            if (newUrl && newUrl !== product.image_url) {
                await supabase.from('products').update({ image_url: newUrl }).eq('id', product.id);
                console.log(`✅ Optimized & Updated: ${product.name_ar}`);
            }
        }
    }

    console.log('\nAll operations completed!');
}

main();
