import 'server-only'

// Supabase caps every select at 1000 rows (PostgREST `max-rows`), so long reads are paged
export const SELECT_PAGE_SIZE = 1000

type PageResult<T> = PromiseLike<{ data: T[] | null; error: unknown }>

/**
 * Reads every row of a query page by page, past the 1000-row cap of Supabase selects.
 * Throws the query error, so callers wrap it in a single `Effect.tryPromise`.
 *
 * @param fetchPage - Runs the query for the inclusive row range `[from, to]`
 */
export async function selectAllPages<T>(
    fetchPage: (from: number, to: number) => PageResult<T>
): Promise<T[]> {
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
