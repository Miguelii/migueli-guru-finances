-- Retention: deletes logs older than 30 days. Runs inside Postgres (no HTTP endpoint),
-- scheduled daily at 03:00 UTC with pg_cron
CREATE OR REPLACE FUNCTION public.purge_old_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.logs
    WHERE created_at < now() - interval '30 days';
END;
$$;

-- Only pg_cron (postgres role) may run it, never the API roles
REVOKE EXECUTE ON FUNCTION public.purge_old_logs() FROM PUBLIC, anon, authenticated;

SELECT cron.schedule(
  'purge-old-logs',
  '0 3 * * *',
  $$ SELECT public.purge_old_logs(); $$
);
