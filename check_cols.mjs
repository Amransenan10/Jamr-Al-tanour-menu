import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const admin = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("Checking columns of the 'orders' table...");
  const { data, error } = await admin.from('orders').select('*').limit(1);
  if (error) {
    console.error('Check failed:', error.message, error.details, error.hint);
  } else {
    if (data && data.length > 0) {
      console.log('Available columns in orders table:', Object.keys(data[0]));
    } else {
      console.log('No orders found in the database. Checking table structure via select query...');
      // Try to select a dummy to see if pickup_time is recognized
      const { error: testError } = await admin.from('orders').select('pickup_time').limit(1);
      if (testError) {
        console.log('Verification test failed. orders.pickup_time does NOT exist. Error:', testError.message);
      } else {
        console.log('Verification test succeeded! orders.pickup_time exists.');
      }
    }
  }
}
run();
