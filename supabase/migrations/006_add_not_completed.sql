-- Add not_completed status and reason to goals table
-- This allows marking goals as not achieved with an optional reason

ALTER TABLE public.goals 
  ADD COLUMN IF NOT EXISTS is_not_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS not_completed_reason TEXT,
  ADD COLUMN IF NOT EXISTS not_completed_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN public.goals.is_not_completed IS 'Indicates if the goal was explicitly marked as not completed/not achieved';
COMMENT ON COLUMN public.goals.not_completed_reason IS 'Optional reason why the goal was not completed';
COMMENT ON COLUMN public.goals.not_completed_at IS 'Timestamp when the goal was marked as not completed';

-- Add constraint to ensure a goal cannot be both completed and not_completed
ALTER TABLE public.goals 
  ADD CONSTRAINT check_goal_status 
  CHECK (NOT (is_completed = true AND is_not_completed = true));
