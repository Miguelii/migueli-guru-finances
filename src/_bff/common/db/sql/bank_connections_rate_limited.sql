-- Migration: allow the RATE_LIMITED sync status (Enable Banking 429, daily PSD2 quota used up).
-- Run before deploying the code that writes it, otherwise the status update is rejected
ALTER TABLE public.bank_connections
  DROP CONSTRAINT IF EXISTS bank_connections_last_sync_status_check;

ALTER TABLE public.bank_connections
  ADD CONSTRAINT bank_connections_last_sync_status_check
  CHECK (last_sync_status IN ('OK', 'EXPIRED', 'ERROR', 'RATE_LIMITED'));

-- Rows flagged as ERROR by a 429 before this fix
UPDATE public.bank_connections
  SET last_sync_status = 'RATE_LIMITED'
  WHERE last_sync_status = 'ERROR';
