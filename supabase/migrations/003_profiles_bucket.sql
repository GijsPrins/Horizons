-- Migration 003: Profiles Storage Bucket
-- Run this in your Supabase SQL Editor

-- Create the storage bucket for profiles/avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the 'profiles' bucket

-- Allow authenticated users to upload their own avatar
-- (We use the user ID as the file name prefix strictly in useAuth, 
-- but for simplicity in RLS we often just allow authenticated uploads 
-- and manage overwrites via logic or stricter RLS if needed. 
-- Here we allow any authenticated user to upload to 'profiles' bucket)
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profiles');

-- Allow public to view avatars
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'profiles');

-- Allow users to update/delete their own avatars
-- This relies on the convention that the file name is "{user_id}.ext"
-- or that the file is in a folder named "{user_id}"
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'profiles' AND name LIKE (auth.uid() || '.%'))
WITH CHECK (bucket_id = 'profiles' AND name LIKE (auth.uid() || '.%'));

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'profiles' AND name LIKE (auth.uid() || '.%'));
