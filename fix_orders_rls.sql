-- =============================================
-- STEP 1: Run this in Supabase SQL Editor
-- Dashboard > SQL Editor > New query > Paste > Run
-- =============================================

-- Allow anyone to update order status (needed for cashier)
DROP POLICY IF EXISTS "Allow public update on orders" ON orders;
CREATE POLICY "Allow public update on orders" 
ON orders FOR UPDATE 
USING (true) 
WITH CHECK (true);

-- Allow reading all orders
DROP POLICY IF EXISTS "Allow public select on orders" ON orders;
CREATE POLICY "Allow public select on orders" 
ON orders FOR SELECT 
USING (true);

-- Allow inserting orders (for customers)
DROP POLICY IF EXISTS "Allow public insert on orders" ON orders;
CREATE POLICY "Allow public insert on orders" 
ON orders FOR INSERT 
WITH CHECK (true);
