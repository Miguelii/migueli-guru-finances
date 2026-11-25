-- One payslip per user and month: the net base salary and the meal allowance paid that month.
-- Reads and writes go through RLS (own rows only), with the cookie-based session client.
CREATE TABLE IF NOT EXISTS public.payslips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  year smallint NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  month smallint NOT NULL CHECK (month BETWEEN 1 AND 12),
  net_salary numeric NOT NULL CHECK (net_salary >= 0),
  meal_allowance numeric NOT NULL DEFAULT 0 CHECK (meal_allowance >= 0),
  note text CHECK (char_length(note) <= 60),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, year, month)
);

ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own payslips"
  ON public.payslips
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own payslips"
  ON public.payslips
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own payslips"
  ON public.payslips
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own payslips"
  ON public.payslips
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);
