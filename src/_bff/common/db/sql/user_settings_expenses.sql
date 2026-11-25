-- Migration for a user_settings table created before monthly expenses existed.
-- Adding an expense may create the row, so salary and goal can no longer be required.
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS monthly_expenses jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(monthly_expenses) = 'array');

ALTER TABLE public.user_settings ALTER COLUMN net_monthly_salary_eur DROP NOT NULL;
ALTER TABLE public.user_settings ALTER COLUMN emergency_fund_goal_eur DROP NOT NULL;
