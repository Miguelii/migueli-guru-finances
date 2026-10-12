-- One row per user and calendar day (Europe/Lisbon) with the portfolio totals in EUR.
-- The hourly update-tickers cron upserts today's row, so the last run of the day wins.
-- Past days can be rebuilt from historical closes (snapshots.rebuild).
-- Reads go through RLS (own rows only). Writes use the service-role client.
CREATE TABLE IF NOT EXISTS public.portfolio_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  value_eur numeric NOT NULL,
  invested_eur numeric NOT NULL,
  realized_gl_eur numeric NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, snapshot_date)
);

ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own portfolio snapshots"
  ON public.portfolio_snapshots
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);
