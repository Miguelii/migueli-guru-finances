-- Batch price update: writes every fetched ticker price in one UPDATE, called by the
-- price update flows through the service-role client (supabase.rpc('update_ticker_prices'))
-- Input: [{ "ticker": "BTC", "price": 123.4 }, ...]
CREATE OR REPLACE FUNCTION public.update_ticker_prices(prices jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  UPDATE public.data
    SET curr_price = p.price, last_updated_at = now()
    FROM jsonb_to_recordset(prices) AS p(ticker text, price numeric)
    WHERE data.ticker = p.ticker;
END;
$$;

-- Only the service-role client may run it, never the public API roles
REVOKE EXECUTE ON FUNCTION public.update_ticker_prices(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_ticker_prices(jsonb) TO service_role;
