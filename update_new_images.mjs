import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import sharp from 'sharp';
import fs from 'fs';
import convert from 'heic-convert';
import { Buffer } from 'node:buffer';

dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing credentials in .env");
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);

const itemsToUpdate = [
  { nameKeywords: 'نوفا', driveId: '14ES5ANpFrM4eg68s-mJNO8xVtlM-7jLj', fileName: 'nova_water_v2.jpg' },
];

async function processAndUploadImage(item) {
  try {
    const driveUrl = `https://drive.usercontent.google.com/download?id=${item.driveId}&export=download`;
    console.log(`Downloading ${item.fileName}...`);
    
    // Download
    const res = await fetch(driveUrl);
    if (!res.ok) throw new Error(`Fetch failed: ${res.statusText}`);
    const buffer = await res.arrayBuffer();

    // Optimize
    console.log(`Optimizing ${item.fileName}...`);
    let optimizedBuffer;
    const imageBuffer = Buffer.from(buffer);
    
    try {
      optimizedBuffer = await sharp(imageBuffer)
        .resize({ width: 800, height: 800, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .jpeg({ quality: 85 })
        .toBuffer();
    } catch (err) {
      if (err.message.includes('heif') || err.message.includes('bad seek')) {
        console.log(`Fallback: Converting HEIC to JPEG for ${item.fileName}...`);
        const jpegBuffer = await convert({
          buffer: imageBuffer,
          format: 'JPEG',
          quality: 1
        });
        optimizedBuffer = await sharp(Buffer.from(jpegBuffer))
          .resize({ width: 800, height: 800, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
          .jpeg({ quality: 85 })
          .toBuffer();
      } else {
        throw err;
      }
    }

    // Upload to Supabase Storage
    console.log(`Uploading ${item.fileName} to storage...`);
    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/product-images/${item.fileName}`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'image/jpeg',
        'x-upsert': 'true' // overwrite if exists
      },
      body: optimizedBuffer
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error(`Storage upload failed for ${item.fileName}:`, errText);
      return false;
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/product-images/${item.fileName}`;
    console.log(`Linking in database to ${publicUrl}...`);
    
    // Update DB
    let query = supabaseAdmin.from('products').select('id, name_ar');
    if (item.exactName) {
      query = query.eq('name_ar', item.exactName);
    } else {
      query = query.ilike('name_ar', `%${item.nameKeywords}%`);
    }

    const { data: fetchProd, error: fetchErr } = await query;
      
    if (fetchErr) throw fetchErr;
    
    if (fetchProd && fetchProd.length > 0) {
        let updatedCount = 0;
        for(const p of fetchProd) {
            // Check if it's the right item for generic keywords
            if (item.nameKeywords === 'كولا' && !p.name_ar.includes('لتر') && !p.name_ar.includes('عائلي') && !item.exactName) {
                // Skip regular cola if we are targeting 1L, but we used exactName so it's fine
            }

            console.log(`Updating product: ${p.name_ar}`);
            const { error: updateErr } = await supabaseAdmin
              .from('products')
              .update({ image_url: publicUrl })
              .eq('id', p.id);
            if (updateErr) throw updateErr;
            updatedCount++;
        }
        console.log(`✅ Success for ${item.nameKeywords} (${updatedCount} products updated)`);
        return true;
    } else {
        console.error(`❌ Product matching ${item.nameKeywords} not found in database!`);
        return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${item.fileName}:`, error.message || error);
    return false;
  }
}

async function run() {
  for (const item of itemsToUpdate) {
    await processAndUploadImage(item);
  }
  console.log("All done!");
}

run();
