import { unstable_cache } from 'next/cache'
import { DBTables } from '@/_bff/common/db/types'
import type { SbClient } from '@/_bff/common/db/types'
import type { PortfolioSnapshotPoint } from '@/lib/portfolio/portfolio-snapshots'
import type { Transaction } from '@/types/Transaction'
import {
    GET_PORTFOLIO_SNAPSHOTS_CACHE_KEY,
    GET_PORTFOLIO_SNAPSHOTS_REVALIDATE_TIME,
    PORTFOLIO_SNAPSHOT_COLUMNS,
    SELECT_PAGE_SIZE,
    getPortfolioSnapshotsCacheTag,
} from '@/_bff/modules/snapshots/snapshots.constants'

type PortfolioSnapshotRow = {
    snapshot_date: string
    value_eur: number
    invested_eur: number
    realized_gl_eur: number
}

export type UserTransaction = Transaction & { user_id: string }

type PageResult<T> = PromiseLike<{ data: T[] | null; error: Error | null }>

/**
 * Reads every row of a query page by page, past the 1000-row cap of Supabase selects.
 * Throws the query error, so callers wrap it in a single `Effect.tryPromise`.
 *
 * @param fetchPage - Runs the query for the inclusive row range `[from, to]`
 */
async function selectAllPages<T>(fetchPage: (from: number, to: number) => PageResult<T>) {
    const rows: T[] = []

    for (let from = 0; ; from += SELECT_PAGE_SIZE) {
        // Sequential on purpose: the next page only exists if this one came back full
        // oxlint-disable-next-line no-await-in-loop
        const { data, error } = await fetchPage(from, from + SELECT_PAGE_SIZE - 1)

        if (error) throw error

        rows.push(...(data ?? []))

        if (!data || data.length < SELECT_PAGE_SIZE) return rows
    }
}

/**
 * Creates a cached function that fetches the user's month-end snapshots (the last stored
 * day of each month), oldest first. Twelve rows per year, so no paging is needed.
 *
 * @param supabaseClient
 * @param userId - Scopes the query (`user_id` filter) and the cache key
 */
export const getMonthlySnapshotsByUserIdFn = (supabaseClient: SbClient, userId: string) =>
    unstable_cache(
        async (): Promise<PortfolioSnapshotPoint[]> => {
            const { data, error } = await supabaseClient
                .from(DBTables.PORTFOLIO_SNAPSHOTS_MONTHLY)
                .select(PORTFOLIO_SNAPSHOT_COLUMNS)
                .eq('user_id', userId)
                .order('snapshot_date', { ascending: true })
                .overrideTypes<PortfolioSnapshotRow[]>()

            if (error) throw error

            return (data ?? []).map((row) => ({
                date: row.snapshot_date,
                valueEur: Number(row.value_eur),
                investedEur: Number(row.invested_eur),
                realizedGlEur: Number(row.realized_gl_eur),
            }))
        },
        [GET_PORTFOLIO_SNAPSHOTS_CACHE_KEY, userId],
        {
            revalidate: GET_PORTFOLIO_SNAPSHOTS_REVALIDATE_TIME,
            tags: [GET_PORTFOLIO_SNAPSHOTS_CACHE_KEY, getPortfolioSnapshotsCacheTag(userId)],
        }
    )

export function selectAllTickers(supabaseClient: SbClient) {
    return supabaseClient.from(DBTables.DATA).select('*')
}

/**
 * Fetches the transactions of every user (service-role client), paged past the row cap.
 *
 * @param supabaseClient - Service-role client
 */
export function selectAllTransactions(supabaseClient: SbClient) {
    return selectAllPages<UserTransaction>((from, to) =>
        supabaseClient
            .from(DBTables.TRANSACTIONS)
            .select('*')
            .order('id')
            .range(from, to)
            .overrideTypes<UserTransaction[]>()
    )
}

/**
 * Fetches all transactions of one user (uncached, paged past the row cap).
 *
 * @param supabaseClient
 * @param userId - Owner of the transactions
 */
export function selectTransactionsByUserId(supabaseClient: SbClient, userId: string) {
    return selectAllPages<UserTransaction>((from, to) =>
        supabaseClient
            .from(DBTables.TRANSACTIONS)
            .select('*')
            .eq('user_id', userId)
            .order('id')
            .range(from, to)
            .overrideTypes<UserTransaction[]>()
    )
}

/**
 * Inserts or replaces snapshots, one per user and day (`user_id, snapshot_date` unique).
 *
 * @param supabaseClient - Service-role client
 * @param snapshots - Rows to write, each with its owner
 */
export function upsertSnapshots(
    supabaseClient: SbClient,
    snapshots: (PortfolioSnapshotPoint & { userId: string })[]
) {
    const updatedAt = new Date().toISOString()

    return supabaseClient.from(DBTables.PORTFOLIO_SNAPSHOTS).upsert(
        snapshots.map((snapshot) => ({
            user_id: snapshot.userId,
            snapshot_date: snapshot.date,
            value_eur: snapshot.valueEur,
            invested_eur: snapshot.investedEur,
            realized_gl_eur: snapshot.realizedGlEur,
            updated_at: updatedAt,
        })),
        { onConflict: 'user_id,snapshot_date' }
    )
}

/**
 * Deletes the user's snapshots older than a day (left over from deleted transactions).
 *
 * @param supabaseClient - Service-role client
 * @param userId - Owner of the rows
 * @param date - First day to keep, `YYYY-MM-DD`
 */
export function deleteSnapshotsBefore(supabaseClient: SbClient, userId: string, date: string) {
    return supabaseClient
        .from(DBTables.PORTFOLIO_SNAPSHOTS)
        .delete()
        .eq('user_id', userId)
        .lt('snapshot_date', date)
}

export function deleteAllSnapshotsByUserId(supabaseClient: SbClient, userId: string) {
    return supabaseClient.from(DBTables.PORTFOLIO_SNAPSHOTS).delete().eq('user_id', userId)
}
