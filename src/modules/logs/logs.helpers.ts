import { LOG_RANGE_MS, type LogRange } from '@/lib/constants/logs'
import { LOG_LEVELS, LOGS_HISTOGRAM_BUCKETS, LOGS_LOCALE } from '@/modules/logs/logs.constants'
import { LogLevel, type LogEntry } from '@/types/Log'

export type LogFilters = {
    levels: LogLevel[]
    source: string | null
}

export type LogFacet<T extends string> = {
    value: T
    count: number
}

export type LogHistogramBucket = Record<`${LogLevel}`, number> & {
    start: number
}

const LONG_RANGE_MS = LOG_RANGE_MS['24h']

/**
 * Keeps the logs matching every active filter. An empty `levels` list means "all levels"
 * and a `null` source means "all sources".
 * @param logs - Logs fetched for the current range and search.
 * @param filters - Client-side level and source filters.
 */
export function filterLogs(logs: LogEntry[], { levels, source }: LogFilters): LogEntry[] {
    return logs.filter(
        (log) =>
            (levels.length === 0 || levels.includes(log.level)) &&
            (source === null || log.prefix === source)
    )
}

export function countLevelFacets(logs: LogEntry[]): LogFacet<LogLevel>[] {
    const counts = new Map<LogLevel, number>()
    for (const log of logs) counts.set(log.level, (counts.get(log.level) ?? 0) + 1)

    return LOG_LEVELS.map((level) => ({ value: level, count: counts.get(level) ?? 0 }))
}

/**
 * Counts logs per source (`prefix`), most frequent first, ties sorted alphabetically.
 * @param logs - Logs to count.
 */
export function countSourceFacets(logs: LogEntry[]): LogFacet<string>[] {
    const counts = new Map<string, number>()
    for (const log of logs) counts.set(log.prefix, (counts.get(log.prefix) ?? 0) + 1)

    return Array.from(counts, ([value, count]) => ({ value, count })).toSorted(
        (a, b) => b.count - a.count || a.value.localeCompare(b.value)
    )
}

/**
 * Splits the range ending at `endMs` into equal time buckets and counts logs per level in
 * each one. Logs outside the range are clamped into the first or last bucket.
 * @param logs - Logs to bucket.
 * @param range - Selected time range.
 * @param endMs - End of the range (the server fetch time, so SSR and hydration agree).
 */
export function buildHistogramBuckets(
    logs: LogEntry[],
    range: LogRange,
    endMs: number
): LogHistogramBucket[] {
    const rangeMs = LOG_RANGE_MS[range]
    const bucketMs = rangeMs / LOGS_HISTOGRAM_BUCKETS
    const startMs = endMs - rangeMs

    const buckets: LogHistogramBucket[] = Array.from(
        { length: LOGS_HISTOGRAM_BUCKETS },
        (_, index) => ({
            start: startMs + index * bucketMs,
            [LogLevel.Error]: 0,
            [LogLevel.Warn]: 0,
            [LogLevel.Info]: 0,
            [LogLevel.Debug]: 0,
        })
    )

    for (const log of logs) {
        const offset = Math.floor((new Date(log.created_at).getTime() - startMs) / bucketMs)
        const index = Math.min(Math.max(offset, 0), LOGS_HISTOGRAM_BUCKETS - 1)
        buckets[index][log.level] += 1
    }

    return buckets
}

/**
 * Axis label for a histogram bucket: time of day for ranges up to 24h, day and month beyond.
 * @param timestampMs - Bucket start.
 * @param range - Selected time range.
 */
export function formatBucketLabel(timestampMs: number, range: LogRange): string {
    const date = new Date(timestampMs)

    if (LOG_RANGE_MS[range] > LONG_RANGE_MS) {
        return date.toLocaleDateString(LOGS_LOCALE, { day: '2-digit', month: 'short' })
    }

    return date.toLocaleTimeString(LOGS_LOCALE, { hour: '2-digit', minute: '2-digit' })
}

export function formatLogTime(createdAt: string): string {
    return new Date(createdAt).toLocaleTimeString(LOGS_LOCALE, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
    })
}

export function formatLogDate(createdAt: string): string {
    return new Date(createdAt).toLocaleDateString(LOGS_LOCALE, { day: '2-digit', month: 'short' })
}

export function formatLogTimestamp(createdAt: string): string {
    return `${new Date(createdAt).toLocaleDateString(LOGS_LOCALE, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })} ${formatLogTime(createdAt)}`
}

/**
 * Reads the tagged error summary (`_tag`, `error_hash`) stored by the BFF `Logger` under
 * `metadata.error`, if any.
 * @param log - Log entry to inspect.
 */
export function getLogErrorSummary(log: LogEntry): { tag?: string; hash?: string } {
    const error = log.metadata?.error

    if (typeof error !== 'object' || error === null) return {}

    const { _tag: tag, error_hash: hash } = error as Record<string, unknown>

    return {
        tag: typeof tag === 'string' ? tag : undefined,
        hash: typeof hash === 'string' ? hash : undefined,
    }
}
