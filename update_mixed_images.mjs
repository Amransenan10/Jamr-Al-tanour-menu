import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import sharp from 'sharp';
import fs from 'fs';
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
  { name: 'كولا (١ لتر)', driveId: '1ZT1a1Mn81dqzQfzthp0Fd7aHMVzxkdgH', fileName: 'cola_1l_new.jpg' },
  { name: 'مياه نوفا', driveId: '14ES5ANpFrM4eg68s-mJNO8xVtlM-7jLj', fileName: 'nova_water.jpg' },
  { name: 'بيتزا رانش', driveId: '1JExe-cO2Dm1y-M_xZ_Jqj1JY5Jlm_tI5', fileName: 'pizza_ranch.jpg' },
  { name: 'فطيرة فلافل', driveId: '13pqaGihkgCRWgGMPRmWXqHjHt7TNOzlv', fileName: 'falafel_pie.jpg' },
  { name: 'فطيرة فلافل بيض', driveId: '13pqaGihkgCRWgGMPRmWXqHjHt7TNOzlv', fileName: 'falafel_egg_pie.jpg' },
  { name: 'قشطة عسل', driveId: '1edCPFmNwaK6rnCBHGF2Ut9sKCCLnxFaV', fileName: 'qishta_honey.jpg' },
  { name: 'عرايس سبانخ', driveId: '1Lgo1l_QEK1EtttIW4195SDiMK1JYscmm', fileName: 'arais_spinach.jpg' }
];

async function processAndUploadImage(item) {
  try {
    const driveUrl = `https://drive.usercontent.google.com/download?id=${item.driveId}&export=download`;
    console.log(`Downloading ${item.name}...`);
    
    // Download
    const res = await fetch(driveUrl);
    if (!res.ok) throw new Error(`Fetch failed: ${res.statusText}`);
    const buffer = await res.arrayBuffer();

    // Optimize
    console.log(`Optimizing ${item.name}...`);
    const optimizedBuffer = await sharp(Buffer.from(buffer))
      .resize({ width: 1000, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Upload to Supabase Storage
    console.log(`Uploading ${item.name} to storage...`);
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
      console.error(`Storage upload failed for ${item.name}:`, errText);
      return false;
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/product-images/${item.fileName}`;
    console.log(`Linking ${item.name} in database to ${publicUrl}...`);
    
    // Update DB
    const { data: fetchProd, error: fetchErr } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('name_ar', item.name);
      
    if (fetchErr) throw fetchErr;
    
    if (fetchProd && fetchProd.length > 0) {
        for(const p of fetchProd) {
            const { error: updateErr } = await supabaseAdmin
              .from('products')
              .update({ image_url: publicUrl })
              .eq('id', p.id);
            if (updateErr) throw updateErr;
        }
        console.log(`✅ Success for ${item.name}`);
        return true;
    } else {
        console.error(`❌ Product ${item.name} not found in database!`);
        return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${item.name}:`, error.message || error);
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
