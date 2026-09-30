-- One Enable Banking (PSD2) connection per user, holding the last synced cash balance.
-- Reads go through RLS (own row only). Writes use the service-role client.
CREATE TABLE IF NOT EXISTS public.bank_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  aspsp_name text NOT NULL,
  aspsp_country text NOT NULL,
  pending_state uuid,
  session_id text,
  account_uid text,
  consent_valid_until timestamptz,
  balance numeric,
  currency text,
  balance_updated_at timestamptz,
  last_sync_status text CHECK (last_sync_status IN ('OK', 'EXPIRED', 'ERROR', 'RATE_LIMITED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own bank connection"
  ON public.bank_connections
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);


-- Save API key in Vault
SELECT vault.create_secret(
  'KEY_VALUE',
  'NAME',
  'DESC'
);

SELECT id,decrypted_secret FROM vault.decrypted_secrets WHERE name = 'NAME';
