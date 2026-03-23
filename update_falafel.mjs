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

async function optimizeAndUpload(sourceBuffer, targetName) {
    try {
        console.log(`Optimizing ${targetName}...`);
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
    const updates = [
        { 
            name_ar_list: ['4 حبات'], 
            name_token: 'falafel_pieces.jpg', 
            driveLink: 'https://drive.google.com/file/d/1DOtlxRilVXgfu7TYS2RXLL8xDEvf4c-_/view?usp=drivesdk' 
        },
        { 
            name_ar_list: ['ساندوتش فلافل', 'ساندوتش فلافل مع البيض'], 
            name_token: 'falafel_rocket.jpg', 
            driveLink: 'https://drive.google.com/file/d/1Z9U1jHtZAblp_V52V4JBmqv9P45DXkI8/view?usp=drivesdk' 
        }
    ];

    for (const update of updates) {
        const driveId = extractDriveId(update.driveLink);
        if (!driveId) continue;
        const downloadUrl = `https://drive.usercontent.google.com/download?id=${driveId}&export=download`;
        const buffer = await downloadFromURL(downloadUrl);
        
        if (buffer) {
            const newUrl = await optimizeAndUpload(buffer, update.name_token);
            if (newUrl) {
                for (const name_ar of update.name_ar_list) {
                    const { error } = await supabase.from('products').update({ image_url: newUrl }).eq('name_ar', name_ar);
                    console.log(error ? `DB Fail: ${name_ar}` : `✅ Updated ${name_ar}`);
                }
            }
        } else {
            console.error(`❌ Could not download drive link for ${update.name_token}`);
        }
    }
}

main();
