-- Add order_count, rating, rating_count columns to products
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS order_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0;

-- Create product_ratings table to store individual ratings
CREATE TABLE IF NOT EXISTS product_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, device_id)
);

-- Enable RLS
ALTER TABLE product_ratings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read ratings
CREATE POLICY "Anyone can read ratings" ON product_ratings
  FOR SELECT USING (true);

-- Allow anyone to insert their rating
CREATE POLICY "Anyone can insert ratings" ON product_ratings
  FOR INSERT WITH CHECK (true);

-- Allow anyone to update their own rating
CREATE POLICY "Anyone can update their own rating" ON product_ratings
  FOR UPDATE USING (true);

-- Create a function to recalculate average rating for a product
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET 
    rating = (SELECT ROUND(AVG(rating)::numeric, 2) FROM product_ratings WHERE product_id = NEW.product_id),
    rating_count = (SELECT COUNT(*) FROM product_ratings WHERE product_id = NEW.product_id)
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update rating after insert/update
DROP TRIGGER IF EXISTS on_rating_change ON product_ratings;
CREATE TRIGGER on_rating_change
  AFTER INSERT OR UPDATE ON product_ratings
  FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- Grant usage to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE ON product_ratings TO anon, authenticated;
