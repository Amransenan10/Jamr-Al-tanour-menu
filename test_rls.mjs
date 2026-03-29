import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hkkgolabztqgoxjnbqpe.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhra2dvbGFienRxZ294am5icXBlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjA2MjUyNywiZXhwIjoyMDg3NjM4NTI3fQ.qC7O-b9r_0EPC6d3KjJ8byX_vUE16CDrz68y0MN6pjc';

const supabase = createClient(supabaseUrl, serviceRoleKey);

const tables = ['products', 'categories', 'option_groups', 'option_items', 'coupons', 'branch_credentials', 'orders', 'store_settings'];

async function disableRLS() {
  for (const table of tables) {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`
    }).catch(() => ({ error: null }));

    // Try direct query approach
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({ sql: `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;` })
    });
    console.log(`Table ${table}: ${res.status}`);
  }
}

// Alternative: Try direct REST to check if anon can update products
async function testUpdate() {
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhra2dvbGFienRxZ294am5icXBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNjI1MjcsImV4cCI6MjA4NzYzODUyN30.vllMD6PPO19pe2T746NiEYOzbwKYTZRQuE2jCG6_tIo';
  
  // Check if we can read from products with anon key
  const readRes = await fetch(`${supabaseUrl}/rest/v1/products?limit=1`, {
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`
    }
  });
  const readData = await readRes.json();
  
  if (readData.length === 0) {
    console.log('No products found.');
    return;
  }
  
  const product = readData[0];
  console.log('Test product:', product.name_ar, 'price:', product.price, 'id:', product.id);
  
  // Try to update with anon key
  const updateRes = await fetch(`${supabaseUrl}/rest/v1/products?id=eq.${product.id}`, {
    method: 'PATCH',
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ price: product.price }) // Set same price (no actual change)
  });
  
  const updateText = await updateRes.text();
  console.log('Update status:', updateRes.status);
  console.log('Update response:', updateText);
  
  if (updateRes.status === 200 || updateRes.status === 204) {
    console.log('✅ SUCCESS: anon key CAN update products. RLS is disabled or allows updates.');
  } else {
    console.log('❌ FAIL: anon key CANNOT update products. RLS is blocking updates.');
    console.log('Need to disable RLS on products table in Supabase dashboard.');
  }
}

testUpdate().catch(console.error);
