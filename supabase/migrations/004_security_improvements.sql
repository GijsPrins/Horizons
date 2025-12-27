-- Security Improvements Migration
-- This migration adds server-side admin verification functions
-- Run this in your Supabase SQL Editor

-- ============================================
-- Helper function to verify if user is app admin
-- ============================================
CREATE OR REPLACE FUNCTION public.is_app_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to check admin status
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id
    AND is_app_admin = TRUE
  );
END;
$$;

-- ============================================
-- Helper function to verify if user is team admin
-- ============================================
CREATE OR REPLACE FUNCTION public.is_team_admin(user_id UUID, team_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.user_id = user_id
    AND team_members.team_id = team_id
    AND team_members.role = 'admin'
  );
END;
$$;

-- ============================================
-- Function to safely update categories (admin-only for global)
-- ============================================
CREATE OR REPLACE FUNCTION public.update_global_category(
  category_id UUID,
  new_name TEXT DEFAULT NULL,
  new_color TEXT DEFAULT NULL,
  new_icon TEXT DEFAULT NULL,
  new_sort_order INTEGER DEFAULT NULL
)
RETURNS public.categories
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.categories;
BEGIN
  -- Verify user is app admin
  IF NOT public.is_app_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only app admins can update global categories';
  END IF;

  -- Update the category
  UPDATE public.categories
  SET
    name = COALESCE(new_name, name),
    color = COALESCE(new_color, color),
    icon = COALESCE(new_icon, icon),
    sort_order = COALESCE(new_sort_order, sort_order)
  WHERE id = category_id
  AND team_id IS NULL -- Ensure it's a global category
  RETURNING * INTO result;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Category not found or not a global category';
  END IF;

  RETURN result;
END;
$$;

-- ============================================
-- Function to safely delete global categories (admin-only)
-- ============================================
CREATE OR REPLACE FUNCTION public.delete_global_category(category_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify user is app admin
  IF NOT public.is_app_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only app admins can delete global categories';
  END IF;

  -- Delete the category
  DELETE FROM public.categories
  WHERE id = category_id
  AND team_id IS NULL; -- Ensure it's a global category

  RETURN FOUND;
END;
$$;

-- ============================================
-- Grant execute permissions
-- ============================================
GRANT EXECUTE ON FUNCTION public.is_app_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_team_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_global_category(UUID, TEXT, TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_global_category(UUID) TO authenticated;

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON FUNCTION public.is_app_admin IS 'Safely check if a user is an app admin. Uses SECURITY DEFINER to prevent client-side manipulation.';
COMMENT ON FUNCTION public.is_team_admin IS 'Safely check if a user is a team admin. Uses SECURITY DEFINER to prevent client-side manipulation.';
COMMENT ON FUNCTION public.update_global_category IS 'Admin-only function to update global categories with server-side validation.';
COMMENT ON FUNCTION public.delete_global_category IS 'Admin-only function to delete global categories with server-side validation.';
