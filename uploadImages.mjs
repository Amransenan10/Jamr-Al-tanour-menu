import fs from 'fs';

const SUPABASE_URL = 'https://hkkgolabztqgoxjnbqpe.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhra2dvbGFienRxZ294am5icXBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNjI1MjcsImV4cCI6MjA4NzYzODUyN30.vllMD6PPO19pe2T746NiEYOzbwKYTZRQuE2jCG6_tIo';

async function uploadImage(driveUrl, targetName) {
  try {
    console.log(`Downloading ${driveUrl}`);
    const res = await fetch(driveUrl);
    const buffer = await res.arrayBuffer();
    
    console.log(`Uploading ${targetName} to Supabase...`);
    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/product-images/${targetName}`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'image/jpeg',
        'x-upsert': 'true'
      },
      body: Buffer.from(buffer)
    });
    
    if (!uploadRes.ok) {
        console.error("Upload failed", await uploadRes.text());
        return null;
    }
    
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/product-images/${targetName}`;
    console.log(`Success! URL: ${publicUrl}`);
    return publicUrl;
  } catch(e) {
    console.error("Error:", e);
  }
}

async function main() {
  const images = [
    { name: 'cola_can.jpg', id: '1hHyAWtyJrkZU6Rsr8_-px_Bq_-r4ad4w' },
    { name: 'sprite_can.jpg', id: '1DMk0wEWOcswKhPLTlQZUCy0vVxINw5jt' },
    { name: 'citrus_can.jpg', id: '1eowfYqOHASdXyLmTM0EQfpVsIERIh0Zy' },
    { name: 'cola_1liter.jpg', id: '1ZT1a1Mn81dqzQfzthp0Fd7aHMVzxkdgH' },
    { name: 'kinza.jpg', id: '1GmoX11LrLCcfbVPTEIqyuMrS0mrn8t4Z' }
  ];

  const results = {};
  for (const img of images) {
    const driveUrl = `https://drive.usercontent.google.com/download?id=${img.id}&export=download`;
    results[img.name] = await uploadImage(driveUrl, img.name);
  }

  console.log("FINAL_URLS", results);
}

main();
