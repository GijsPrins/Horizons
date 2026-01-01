-- Migration 007: Feedback System
-- Bug reports and feature requests with screenshots
-- Created: 2026-01-01

-- ============================================
-- 1. Create Tables
-- ============================================

CREATE TABLE public.feedback_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature')),
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  current_url TEXT,
  screenshot_url TEXT,
  browser_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE public.feedback_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.feedback_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  is_admin_comment BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. Create Indexes
-- ============================================

CREATE INDEX idx_feedback_reports_user_id ON public.feedback_reports(user_id);
CREATE INDEX idx_feedback_reports_status ON public.feedback_reports(status);
CREATE INDEX idx_feedback_reports_created_at ON public.feedback_reports(created_at DESC);
CREATE INDEX idx_feedback_comments_report_id ON public.feedback_comments(report_id);

-- ============================================
-- 3. Enable RLS
-- ============================================

ALTER TABLE public.feedback_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_comments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. RLS Policies for feedback_reports
-- ============================================

CREATE POLICY "Users can view own feedback" ON public.feedback_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create feedback" ON public.feedback_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback" ON public.feedback_reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback" ON public.feedback_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_app_admin = TRUE
    )
  );

CREATE POLICY "Admins can update all feedback" ON public.feedback_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_app_admin = TRUE
    )
  );

-- ============================================
-- 5. RLS Policies for feedback_comments
-- ============================================

CREATE POLICY "Users can view comments on own feedback" ON public.feedback_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.feedback_reports
      WHERE feedback_reports.id = feedback_comments.report_id
      AND feedback_reports.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can comment on own feedback" ON public.feedback_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.feedback_reports
      WHERE feedback_reports.id = report_id
      AND feedback_reports.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all comments" ON public.feedback_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_app_admin = TRUE
    )
  );

CREATE POLICY "Admins can comment on all feedback" ON public.feedback_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_app_admin = TRUE
    )
  );

-- ============================================
-- 6. Updated_at Trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_feedback_reports_updated_at
  BEFORE UPDATE ON public.feedback_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_updated_at();

-- ============================================
-- 7. Storage Bucket for Screenshots
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feedback-screenshots',
  'feedback-screenshots',
  false, -- PRIVATE bucket
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 8. Storage RLS Policies
-- ============================================

CREATE POLICY "Users can upload feedback screenshots"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'feedback-screenshots'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own screenshots"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'feedback-screenshots'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all screenshots"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'feedback-screenshots'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_app_admin = TRUE
  )
);
