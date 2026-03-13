import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({path: '.env'});
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
    const sql = `
        CREATE TABLE IF NOT EXISTS public.branch_credentials (
            branch_name TEXT PRIMARY KEY,
            password TEXT NOT NULL
        );
        INSERT INTO public.branch_credentials (branch_name, password)
        VALUES ('السويدي الغربي', '1234'), ('طويق', '1234')
        ON CONFLICT (branch_name) DO UPDATE SET password = EXCLUDED.password;

        ALTER TABLE public.branch_credentials ENABLE ROW LEVEL SECURITY;
        
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies WHERE policyname = 'Allow anon select on branch_credentials'
            ) THEN
                CREATE POLICY "Allow anon select on branch_credentials" 
                ON public.branch_credentials FOR SELECT USING (true);
            END IF;
        END
        $$;
    `;
    const {data, error} = await supabase.rpc('execute_sql', { sql_query: sql });
    console.log('Result:', data);
    if (error) {
        console.error('Error:', error);
    }
}
run();
