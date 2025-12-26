-- Horizons Database Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- STEP 0: Clean up any existing state (Optional but recommended for fixes)
-- ============================================
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();
-- DROP TABLE IF EXISTS public.attachments CASCADE;
-- DROP TABLE IF EXISTS public.progress_entries CASCADE;
-- DROP TABLE IF EXISTS public.goals CASCADE;
-- DROP TABLE IF EXISTS public.categories CASCADE;
-- DROP TABLE IF EXISTS public.team_members CASCADE;
-- DROP TABLE IF EXISTS public.teams CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================
-- STEP 1: Create all tables
-- ============================================

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  is_app_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Members
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE, -- NULL = global
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#607D8B',
  icon TEXT NOT NULL DEFAULT 'mdi-tag',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  year INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('single', 'weekly', 'milestone')) DEFAULT 'single',
  target_count INTEGER, -- For milestone goals
  is_shared BOOLEAN DEFAULT FALSE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progress Entries
CREATE TABLE IF NOT EXISTS public.progress_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  week_number INTEGER, -- For weekly goals
  note TEXT,
  achieved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attachments
CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('url', 'image', 'note', 'milestone')),
  title TEXT,
  url TEXT,
  content TEXT,
  milestone_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 2: Enable RLS on all tables
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: Create RLS Policies
-- ============================================

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Teams policies (simplified to avoid recursion)
CREATE POLICY "Authenticated users can view teams" ON public.teams
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create teams" ON public.teams
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update teams" ON public.teams
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete teams" ON public.teams
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Team Members policies (permissive to avoid recursion)
CREATE POLICY "Authenticated users can view team memberships" ON public.team_members
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can join teams" ON public.team_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave teams" ON public.team_members
  FOR DELETE USING (auth.uid() = user_id);

-- Categories policies
CREATE POLICY "Anyone can view global categories" ON public.categories
  FOR SELECT USING (team_id IS NULL);

CREATE POLICY "Team members can view team categories" ON public.categories
  FOR SELECT USING (
    team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = categories.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "App admins can manage global categories" ON public.categories
  FOR ALL USING (
    team_id IS NULL AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_app_admin = TRUE
    )
  );

CREATE POLICY "Team admins can manage team categories" ON public.categories
  FOR ALL USING (
    team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = categories.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role = 'admin'
    )
  );

-- Goals policies
CREATE POLICY "Users can view own goals" ON public.goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Team members can view shared goals" ON public.goals
  FOR SELECT USING (
    is_shared = TRUE AND EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = goals.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own goals" ON public.goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON public.goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON public.goals
  FOR DELETE USING (auth.uid() = user_id);

-- Progress Entries policies
CREATE POLICY "Users can manage progress on own goals" ON public.progress_entries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.goals
      WHERE goals.id = progress_entries.goal_id
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can view progress on shared goals" ON public.progress_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.goals
      JOIN public.team_members ON team_members.team_id = goals.team_id
      WHERE goals.id = progress_entries.goal_id
      AND goals.is_shared = TRUE
      AND team_members.user_id = auth.uid()
    )
  );

-- Attachments policies
CREATE POLICY "Users can manage attachments on own goals" ON public.attachments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.goals
      WHERE goals.id = attachments.goal_id
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can view attachments on shared goals" ON public.attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.goals
      JOIN public.team_members ON team_members.team_id = goals.team_id
      WHERE goals.id = attachments.goal_id
      AND goals.is_shared = TRUE
      AND team_members.user_id = auth.uid()
    )
  );

-- ============================================
-- STEP 4: Create Functions and Triggers
-- ============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, is_app_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 5: Seed Default Categories
-- ============================================

INSERT INTO public.categories (name, color, icon, sort_order, team_id) VALUES
  ('Carrière', '#F44336', 'mdi-briefcase', 1, NULL),
  ('Creatief', '#FF9800', 'mdi-palette', 2, NULL),
  ('Financieel', '#FFEB3B', 'mdi-currency-eur', 3, NULL),
  ('Gezondheid', '#4CAF50', 'mdi-heart-pulse', 4, NULL),
  ('Overig', '#2196F3', 'mdi-dots-horizontal', 5, NULL),
  ('Persoonlijk', '#3F51B5', 'mdi-account', 6, NULL),
  ('Relatie', '#9C27B0', 'mdi-heart', 7, NULL),
  ('Sport', '#E91E63', 'mdi-run', 8, NULL)
ON CONFLICT DO NOTHING;
