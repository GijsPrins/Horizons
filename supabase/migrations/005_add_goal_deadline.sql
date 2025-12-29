-- Add deadline_date column to goals table
-- This allows users to set an optional deadline for any goal type
ALTER TABLE public.goals
ADD COLUMN deadline_date DATE;

-- Create index for deadline-based queries and sorting
-- Using partial index (WHERE deadline_date IS NOT NULL) for better performance
CREATE INDEX goals_deadline_date_idx ON public.goals(deadline_date)
WHERE deadline_date IS NOT NULL;
