CREATE OR REPLACE FUNCTION public.invoke_sync_bank_balances()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _api_key text;
  _url text;
BEGIN
  SELECT decrypted_secret INTO _api_key
    FROM vault.decrypted_secrets
    WHERE name = 'sync_bank_balances_api_key';

  SELECT decrypted_secret INTO _url
    FROM vault.decrypted_secrets
    WHERE name = 'sync_bank_balances_url';

  PERFORM net.http_post(
    url     := _url,
    body    := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-api-key', _api_key
    )
  );
END;
$$;

-- PSD2 allows at most 4 unattended reads per day: 3 scheduled runs leave one for the
-- read done right after (re)connecting the account
SELECT cron.schedule(
  'sync-bank-balances',
  '0 7,13,19 * * *',
  $$ SELECT public.invoke_sync_bank_balances(); $$
);
