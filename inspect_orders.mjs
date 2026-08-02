import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const admin = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

const { data, error } = await admin.from('orders').select('*').limit(1);
if (error) {
  console.error(error);
} else {
  console.log('Orders sample schema:');
  console.log(JSON.stringify(data && data.length > 0 ? Object.keys(data[0]) : 'No orders found', null, 2));
  if (data && data.length > 0) {
    console.log('Sample order data:');
    console.log(JSON.stringify(data[0], null, 2));
  }
}
