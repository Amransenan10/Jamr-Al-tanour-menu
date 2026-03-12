import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({path: '.env'});

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function extractDriveId(url) {
  const match = url.match(/id=([a-zA-Z0-9_-]+)/) || url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function sanitizeName(name) {
  return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_أ-ي]/g, '') + '.jpg';
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
  const { data: products, error } = await supabase.from('products').select('id, name_ar, image_url, name_en');
  if (error) {
    console.error(error);
    return;
  }
  
  const driveLinks = products.filter(p => p.image_url && p.image_url.includes('drive.'));
  console.log(`Found ${driveLinks.length} products with Drive links.`);

  for (const product of driveLinks) {
    console.log(`Processing: ${product.name_ar}`);
    const driveId = extractDriveId(product.image_url);
    if (!driveId) {
      console.log(`Could not extract Drive ID for ${product.name_ar} (${product.image_url})`);
      continue;
    }

    const targetName = sanitizeName(product.name_en || product.name_ar);
    const newUrl = await uploadImage(driveId, targetName);

    if (newUrl) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: newUrl })
        .eq('id', product.id);
        
      if (updateError) {
        console.error(`Failed to update DB for ${product.name_ar}:`, updateError);
      } else {
        console.log(`✅ Updated DB for ${product.name_ar} -> ${newUrl}`);
      }
    }
    
    // Add a small delay
    await new Promise(r => setTimeout(r, 500));
  }
  
  // Now explicitly update the 5 drink images the user requested
  const requestedUpdates = [
    { name_ar: 'كوكاكولا', url: 'https://hkkgolabztqgoxjnbqpe.supabase.co/storage/v1/object/public/product-images/cola_can.jpg' },
    { name_ar: 'سبرايت', url: 'https://hkkgolabztqgoxjnbqpe.supabase.co/storage/v1/object/public/product-images/sprite_can.jpg' },
    { name_ar: 'حمضيات', url: 'https://hkkgolabztqgoxjnbqpe.supabase.co/storage/v1/object/public/product-images/citrus_can.jpg' },
    { name_ar: 'كولا (١ لتر)', url: 'https://hkkgolabztqgoxjnbqpe.supabase.co/storage/v1/object/public/product-images/cola_1liter.jpg' },
    { name_ar: 'كينزا', url: 'https://hkkgolabztqgoxjnbqpe.supabase.co/storage/v1/object/public/product-images/kinza.jpg' },
    { name_ar: 'سبربنغ رول', url: 'https://hkkgolabztqgoxjnbqpe.supabase.co/storage/v1/object/public/product-images/spring_roll.jpg' }, 
    { name_ar: 'ورق عنب (حبة)', url: 'https://hkkgolabztqgoxjnbqpe.supabase.co/storage/v1/object/public/product-images/grape_leaves.jpg' },
    { name_ar: 'ورق عنب سبايسي - جديد (حبة)', url: 'https://hkkgolabztqgoxjnbqpe.supabase.co/storage/v1/object/public/product-images/grape_leaves.jpg' }
  ];

  for (const update of requestedUpdates) {
      // Find product strictly by exact name_ar first, fallback to includes
      const matchingProduct = products.find(p => p.name_ar === update.name_ar) || products.find(p => p.name_ar.includes(update.name_ar));
      if (matchingProduct) {
          console.log(`Force updating image for requested product: ${matchingProduct.name_ar}`);
          await supabase.from('products').update({ image_url: update.url }).eq('id', matchingProduct.id);
      }
  }

  console.log('Done!');
}

main();
