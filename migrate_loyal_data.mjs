import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// OLD Project (Loyalty) - URL Corrected
const oldUrl = 'https://rkajjaxymqdayfcsxkpo.supabase.co';
const oldServiceKey = process.env.VITE_LOYALTY_SUPABASE_SERVICE_KEY;

// NEW Project (Menu)
const newUrl = process.env.VITE_SUPABASE_URL;
const newServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

async function migrateData() {
    if (!oldServiceKey || !newServiceKey) {
        console.error('Error: Service keys missing in .env');
        return;
    }

    const oldSupabase = createClient(oldUrl, oldServiceKey);
    const newSupabase = createClient(newUrl, newServiceKey);

    console.log('--- Starting Data Migration ---');

    try {
        // 1. Migrate Customers
        console.log('Fetching customers from old database...');
        const { data: customers, error: fetchError } = await oldSupabase.from('customers').select('*');
        
        if (fetchError) {
            console.error('Error fetching customers:', fetchError);
            return;
        }

        if (customers && customers.length > 0) {
            console.log(`Found ${customers.length} customers. Migrating...`);
            const { error: insertError } = await newSupabase.from('customers').upsert(customers.map(c => ({
                phone_number: c.phone_number,
                full_name: c.full_name,
                points_balance: c.points_balance,
                created_at: c.created_at
            })));
            
            if (insertError) {
                console.error('Error inserting customers:', insertError);
            } else {
                console.log('✅ Customers migrated successfully.');
            }
        } else {
            console.log('No customers found to migrate.');
        }

        // 2. Migrate Transactions
        console.log('Fetching transactions from old database...');
        const { data: transactions, error: transError } = await oldSupabase.from('transactions').select('*');
        
        if (transError) {
            console.error('Error fetching transactions:', transError);
        } else if (transactions && transactions.length > 0) {
            console.log(`Found ${transactions.length} transactions. Migrating...`);
            const { error: insertTransError } = await newSupabase.from('transactions').upsert(transactions.map(t => ({
                customer_phone: t.customer_phone,
                amount: t.amount || 0,
                points_earned: t.points_earned,
                points_redeemed: t.points_redeemed,
                staff_id: t.staff_id,
                created_at: t.created_at
            })));
            
            if (insertTransError) {
                console.error('Error inserting transactions:', insertTransError);
            } else {
                console.log('✅ Transactions migrated successfully.');
            }
        }
    } catch (e) {
        console.error('Unexpected error during migration:', e);
    }

    console.log('--- Migration Finished ---');
}

migrateData();
