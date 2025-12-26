-- Migration 002: Storage Setup and RLS Fixes
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. Fix Attachments RLS
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage attachments on own goals" ON public.attachments;
DROP POLICY IF EXISTS "Team members can view attachments on shared goals" ON public.attachments;

-- New more robust policies
-- View policy
CREATE POLICY "Users can view accessible attachments" ON public.attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.goals
      WHERE goals.id = attachments.goal_id
      AND (
        goals.user_id = auth.uid() 
        OR 
        (goals.is_shared = TRUE AND EXISTS (
          SELECT 1 FROM public.team_members
          WHERE team_members.team_id = goals.team_id
          AND team_members.user_id = auth.uid()
        ))
      )
    )
  );

-- Management policy (Insert/Update/Delete) for owners
CREATE POLICY "Owners can manage attachments" ON public.attachments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.goals
      WHERE goals.id = attachments.goal_id
      AND goals.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.goals
      WHERE goals.id = attachments.goal_id
      AND goals.user_id = auth.uid()
    )
  );


-- ============================================
-- 2. Storage Setup
-- ============================================

-- Create the storage bucket for attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the 'attachments' bucket
-- Note: These policies are simple but effective. For production, you might want more granular control.

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'attachments');

-- Allow public to view (since bucket is public)
CREATE POLICY "Public can view attachments"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'attachments');

-- Allow owners to delete files (this assumes they know the path)
CREATE POLICY "Authenticated users can delete attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'attachments');
