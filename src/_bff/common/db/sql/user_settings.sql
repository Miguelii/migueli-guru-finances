-- One row of personal settings per user (salary, goals and monthly expenses used across the app).
-- No row, or a NULL column, means the value was never set. Reads and writes go through RLS.
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  net_monthly_salary_eur numeric CHECK (net_monthly_salary_eur >= 0),
  emergency_fund_goal_eur numeric CHECK (emergency_fund_goal_eur > 0),
  -- [{ id, name, amountEur, category }], validated by the BFF (settings.dto.ts)
  monthly_expenses jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(monthly_expenses) = 'array'),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own settings"
  ON public.user_settings
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own settings"
  ON public.user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.user_settings
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
