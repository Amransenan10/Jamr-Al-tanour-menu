import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({path: '.env'});

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkImages() {
  const { data, error } = await supabase.from('products').select('id, name_ar, image_url');
  if (error) {
    console.error(error);
    return;
  }
  
  const driveLinks = data.filter(p => p.image_url && p.image_url.includes('drive.'));
  console.log('Products with Drive links:', driveLinks);
}

checkImages();
