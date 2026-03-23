import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({path: '.env'});

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function extractDriveId(url) {
  const match = url.match(/id=([a-zA-Z0-9_-]+)/) || url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

async function uploadImage(driveId, targetName) {
  try {
    const driveUrl = `https://drive.usercontent.google.com/download?id=${driveId}&export=download`;
    console.log(`Downloading ${targetName} (${driveUrl})`);
    
    const res = await fetch(driveUrl);
    if (!res.ok) {
        console.error(`Download failed for ${targetName}: ${res.statusText}`);
        return null;
    }
    const buffer = await res.arrayBuffer();
    
    console.log(`Uploading ${targetName} to Supabase...`);
    const uploadRes = await fetch(`${process.env.VITE_SUPABASE_URL}/storage/v1/object/product-images/${targetName}`, {
      method: 'POST',
      headers: {
        'apikey': process.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'image/jpeg',
        'x-upsert': 'true'
      },
      body: Buffer.from(buffer)
    });
    
    if (!uploadRes.ok) {
        console.error(`Upload failed for ${targetName}`, await uploadRes.text());
        return null;
    }
    
    const publicUrl = `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${targetName}`;
    return publicUrl;
  } catch(e) {
    console.error("Error:", e);
    return null;
  }
}

async function main() {
  const beverageUpdates = [
    { id: 'a39a79a7-1ff1-4ff0-ae21-18a7d1b3becc', name: 'cola_can_2026.jpg', driveLink: 'https://drive.google.com/file/d/1hHyAWtyJrkZU6Rsr8_-px_Bq_-r4ad4w/view?usp=drivesdk' },
    { id: 'bfa71b15-49e1-4c88-a0ec-9a20e0766a64', name: 'sprite_can_2026.jpg', driveLink: 'https://drive.google.com/file/d/1DMk0wEWOcswKhPLTlQZUCy0vVxINw5jt/view?usp=drivesdk' },
    { id: 'd1da5323-88b3-41ab-af08-877e59dc75cd', name: 'citrus_can_2026.jpg', driveLink: 'https://drive.google.com/file/d/1eowfYqOHASdXyLmTM0EQfpVsIERIh0Zy/view?usp=drivesdk' },
    { id: 'd753582f-32a3-4a28-9a30-8716b7ed7a15', name: 'cola_1liter_2026.jpg', driveLink: 'https://drive.google.com/file/d/1ZT1a1Mn81dqzQfzthp0Fd7aHMVzxkdgH/view?usp=drivesdk' },
    { id: '2953c00b-f9cb-4d97-b2cc-ca90489d8b56', name: 'kinza_2026.jpg', driveLink: 'https://drive.google.com/file/d/1GmoX11LrLCcfbVPTEIqyuMrS0mrn8t4Z/view?usp=drivesdk' }
  ];


  for (const beverage of beverageUpdates) {
    console.log(`Processing: ${beverage.name}`);
    const driveId = extractDriveId(beverage.driveLink);
    if (!driveId) continue;

    const newUrl = await uploadImage(driveId, beverage.name);
    if (newUrl) {
      const { error } = await supabase.from('products').update({ image_url: newUrl }).eq('id', beverage.id);
      if (error) {
        console.error(`DB Update failed for ${beverage.name}:`, error);
      } else {
        console.log(`✅ Success for ${beverage.name} -> ${newUrl}`);
      }
    }
  }
}

main();
