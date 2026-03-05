import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
    console.log("Testing update...");
    const productId = 'b0000021-2222-2222-2222-222222222222'; // دجاج

    // First check if product exists
    const { data: p, error: e1 } = await supabase.from('products').select('*').eq('id', productId);
    console.log("Before update:", p);

    // Perform update
    const { data, error } = await supabase
        .from('products')
        .update({ image_url: 'https://test.com/image.png' })
        .eq('id', productId)
        .select();

    if (error) {
        console.error("Update error:", error);
    } else {
        console.log("Update success data:", data);
    }

    // Check after update
    const { data: p2 } = await supabase.from('products').select('*').eq('id', productId);
    console.log("After update:", p2);
}

testUpdate();
