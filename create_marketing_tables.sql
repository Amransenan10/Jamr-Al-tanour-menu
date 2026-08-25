-- SQL Setup Script for Marketing & Broadcast Notification Tables in Supabase

-- 1. Create broadcast_notifications table
CREATE TABLE IF NOT EXISTS broadcast_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    promo_code TEXT,
    url TEXT,
    target_group TEXT DEFAULT 'all',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Realtime for broadcast_notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE broadcast_notifications;

-- Enable RLS and Grant Policies
ALTER TABLE broadcast_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Select Broadcasts" ON broadcast_notifications;
CREATE POLICY "Public Select Broadcasts" ON broadcast_notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert Broadcasts" ON broadcast_notifications;
CREATE POLICY "Public Insert Broadcasts" ON broadcast_notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin Full Access Broadcasts" ON broadcast_notifications;
CREATE POLICY "Admin Full Access Broadcasts" ON broadcast_notifications FOR ALL USING (true);


-- 2. Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    endpoint TEXT NOT NULL UNIQUE,
    keys JSONB,
    user_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and Grant Policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Insert Push Subscriptions" ON push_subscriptions;
CREATE POLICY "Public Insert Push Subscriptions" ON push_subscriptions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Select Push Subscriptions" ON push_subscriptions;
CREATE POLICY "Public Select Push Subscriptions" ON push_subscriptions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Full Access Push Subscriptions" ON push_subscriptions;
CREATE POLICY "Admin Full Access Push Subscriptions" ON push_subscriptions FOR ALL USING (true);
