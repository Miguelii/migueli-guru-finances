-- Month-end view of portfolio_snapshots: the latest stored day of each month per user
-- (for the current month, the most recent day). The dashboard chart reads this view, so
-- it gets ~12 rows per year instead of one per day, far below the 1000-row select cap.
-- security_invoker makes the view run with the caller's permissions, so the RLS policy
-- of portfolio_snapshots (own rows only) still applies.
CREATE OR REPLACE VIEW public.portfolio_snapshots_monthly
WITH (security_invoker = true) AS
SELECT DISTINCT ON (user_id, date_trunc('month', snapshot_date))
  user_id,
  snapshot_date,
  value_eur,
  invested_eur,
  realized_gl_eur
FROM public.portfolio_snapshots
ORDER BY user_id, date_trunc('month', snapshot_date), snapshot_date DESC;
