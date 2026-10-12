import { Schedule } from 'effect'

export const GET_PORTFOLIO_SNAPSHOTS_CACHE_KEY = 'getPortfolioSnapshots'

export const GET_PORTFOLIO_SNAPSHOTS_REVALIDATE_TIME = 14400 // 4h

/**
 * Builds the per-user cache tag for the portfolio snapshots, so a user's history rebuild
 * only invalidates their own cached entry (the bare cache key stays as a global tag for
 * the hourly cron, which records every user).
 *
 * @param userId - Owner of the cached snapshots
 */
export const getPortfolioSnapshotsCacheTag = (userId: string) =>
    `${GET_PORTFOLIO_SNAPSHOTS_CACHE_KEY}:${userId}`

export const PORTFOLIO_SNAPSHOT_COLUMNS = 'snapshot_date, value_eur, invested_eur, realized_gl_eur'

// Supabase caps every select at 1000 rows (PostgREST `max-rows`), so long reads are paged
export const SELECT_PAGE_SIZE = 1000

export const UPSERT_CHUNK_SIZE = 500

// Coinbase Exchange allows ~10 public requests per second: keep the history fetches
// below that instead of firing every asset at once
export const PRICE_HISTORY_CONCURRENCY = 4

// Same policy as the ticker price updates: ~2s → ~4s, max 2 retries
export const PRICE_HISTORY_RETRY_POLICY = Schedule.max([
    Schedule.exponential('2 second').pipe(Schedule.jittered),
    Schedule.recurs(2),
])
