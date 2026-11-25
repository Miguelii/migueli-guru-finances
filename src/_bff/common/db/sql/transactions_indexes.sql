-- Serves the per-user list read (user_id filter, buy_date desc, id tie-break for paging)
CREATE INDEX IF NOT EXISTS transactions_user_id_buy_date_idx
  ON public.transactions (user_id, buy_date DESC, id);

-- Verification queries (run manually in the Supabase SQL Editor, not part of the migration)

-- 1) Existing indexes
SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('transactions', 'data');

-- 2) RLS policies: every auth.uid() should be wrapped as (SELECT auth.uid())
--    The data SELECT policy must NOT filter rows by auth.uid(): the assets list is cached
--    once for all users, so a per-user filter would let the first user's rows be served to
--    everyone.
SELECT tablename, policyname, qual, with_check FROM pg_policies
  WHERE tablename IN ('transactions', 'data');

-- 3) Plan of the hot query (replace the uuid)
EXPLAIN ANALYZE SELECT * FROM public.transactions
  WHERE user_id = '00000000-0000-0000-0000-000000000000'
  ORDER BY buy_date DESC, id LIMIT 1000;
