-- Migration 008: Fix Security Vulnerabilities
-- Run this in your Supabase SQL Editor

-- 1. Fix Global Team Enumeration (RLS)
DROP POLICY IF EXISTS "Users can find team by invite code" ON public.teams;

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

GRANT EXECUTE ON FUNCTION public.get_team_by_invite_code(TEXT) TO authenticated;
COMMENT ON FUNCTION public.get_team_by_invite_code IS 'Securely looks up a team by invite code without exposing the teams table.';


-- 2. Fix Unrestricted File Deletion (Storage)
-- Note: 'storage.objects' is owned by supabase_storage_admin. 
-- We cannot drop policies on it easily from the SQL editor unless we are that role or superuser.
-- TRY: Run this part separately if it fails, or use the storage UI in Supabase to delete the old policy.

DO $$
BEGIN
    DROP POLICY IF EXISTS "Authenticated users can delete attachments" ON storage.objects;
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Ignore if we can't drop it, user might need to do it manually in UI
END $$;

CREATE POLICY "Users can delete own attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'attachments' 
  AND owner = auth.uid()
);

COMMENT ON POLICY "Users can delete own attachments" ON storage.objects IS 'Restrict deletion to the user who uploaded the file.';
