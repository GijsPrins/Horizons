-- Migration 008: Fix Security Vulnerabilities
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. Fix Global Team Enumeration (RLS)
-- ============================================

-- Drop the dangerous policy that allowed listing any team by invite code
DROP POLICY IF EXISTS "Users can find team by invite code" ON public.teams;

-- Create a secure RPC function to look up a team by code
-- This prevents enumeration via SELECT * FROM teams
CREATE OR REPLACE FUNCTION public.get_team_by_invite_code(code TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.name, t.description
  FROM public.teams t
  WHERE t.invite_code = code
  LIMIT 1;
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.get_team_by_invite_code(TEXT) TO authenticated;

-- Comments
COMMENT ON FUNCTION public.get_team_by_invite_code IS 'Securely looks up a team by invite code without exposing the teams table.';


-- ============================================
-- 2. Fix Unrestricted File Deletion (Storage)
-- ============================================

-- Drop the dangerous policy that allowed deleting any file in the bucket
DROP POLICY IF EXISTS "Authenticated users can delete attachments" ON storage.objects;

-- Create a strict policy: Users can only delete files they own
-- Note: 'owner' column in storage.objects is automatically set to auth.uid() on upload
CREATE POLICY "Users can delete own attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'attachments' 
  AND owner = auth.uid()
);

-- Comments
COMMENT ON POLICY "Users can delete own attachments" ON storage.objects IS 'Restrict deletion to the user who uploaded the file.';
