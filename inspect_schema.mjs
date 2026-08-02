import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const admin = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

const { data, error } = await admin.from('orders').select('*').limit(1);
if (error) {
  console.error('Error fetching orders:', error.message);
} else if (data && data.length > 0) {
  console.log('Order columns:', Object.keys(data[0]));
} else {
  // If no rows exist, let's try pushing a test query to get the columns or column names via PostgREST
  console.log('No orders found to inspect via object keys. Paging columns query...');
  const { data: cols, error: colError } = await admin.rpc('get_table_columns', { table_name: 'orders' });
  if (colError) {
    // Let's try inserting a dummy empty row to see the schema error or column names
    console.log('Failed to call RPC. Fetching from API...');
  }
}
