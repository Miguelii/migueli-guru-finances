import { DBTables } from '@/_bff/common/db/types'
import type { SbClient } from '@/_bff/common/db/types'
import { LOGS_FETCH_LIMIT } from '@/_bff/modules/logs/logs.constants'
import { buildLogSearchFilter } from '@/_bff/modules/logs/helpers/log-search-filter.helper'

/**
 * Selects the most recent logs created after `since`, optionally matching `search`.
 * Not wrapped in `unstable_cache`: logs are written on every request and must be fresh.
 *
 * @param supabaseClient - Service-role client (the table has no RLS policies)
 * @param filters.since - ISO timestamp, lower bound of `created_at`
 * @param filters.search - Substring matched against `message` and `prefix`
 */
export function selectLogs(
    supabaseClient: SbClient,
    { since, search }: { since: string; search?: string }
) {
    const query = supabaseClient
        .from(DBTables.LOGS)
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(LOGS_FETCH_LIMIT)

    return search ? query.or(buildLogSearchFilter(search)) : query
}
