CREATE OR REPLACE FUNCTION public.invoke_update_tickers()
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
    WHERE name = 'update_tickers_api_key';

  SELECT decrypted_secret INTO _url
    FROM vault.decrypted_secrets
    WHERE name = 'update_tickers_url';

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


SELECT cron.unschedule('update-tickers-every-24h');

SELECT cron.schedule(
  'update-tickers-every-hour',
  '0 * * * *',
  $$ SELECT public.invoke_update_tickers(); $$
);