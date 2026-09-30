import { describe, it, expect } from 'vitest'
import {
    buildHistogramBuckets,
    countLevelFacets,
    countSourceFacets,
    filterLogs,
    getLogErrorSummary,
} from '@/modules/logs/logs.helpers'
import { LOGS_HISTOGRAM_BUCKETS } from '@/modules/logs/logs.constants'
import { LogLevel, type LogEntry } from '@/types/Log'

const END = new Date('2026-09-30T12:00:00.000Z').getTime()

function makeLog(overrides: Partial<LogEntry>): LogEntry {
    return {
        id: crypto.randomUUID(),
        created_at: new Date(END - 60_000).toISOString(),
        level: LogLevel.Info,
        prefix: 'trpc',
        message: 'message',
        metadata: null,
        user_id: null,
        ...overrides,
    }
}

const LOGS = [
    makeLog({ level: LogLevel.Error, prefix: 'trpc' }),
    makeLog({ level: LogLevel.Error, prefix: 'syncBankBalance' }),
    makeLog({ level: LogLevel.Warn, prefix: 'forceSignOut' }),
    makeLog({ level: LogLevel.Info, prefix: 'trpc' }),
]

describe('filterLogs', () => {
    it('returns every log when no filter is active', () => {
        expect(filterLogs(LOGS, { levels: [], source: null })).toHaveLength(4)
    })

    it('combines level and source filters', () => {
        const result = filterLogs(LOGS, { levels: [LogLevel.Error], source: 'trpc' })

        expect(result).toHaveLength(1)
        expect(result[0]).toMatchObject({ level: LogLevel.Error, prefix: 'trpc' })
    })

    it('accepts several levels at once', () => {
        expect(
            filterLogs(LOGS, { levels: [LogLevel.Error, LogLevel.Warn], source: null })
        ).toHaveLength(3)
    })
})

describe('countLevelFacets', () => {
    it('counts every level in severity order, including empty ones', () => {
        expect(countLevelFacets(LOGS)).toEqual([
            { value: LogLevel.Error, count: 2 },
            { value: LogLevel.Warn, count: 1 },
            { value: LogLevel.Info, count: 1 },
            { value: LogLevel.Debug, count: 0 },
        ])
    })
})

describe('countSourceFacets', () => {
    it('sorts by count, then alphabetically', () => {
        expect(countSourceFacets(LOGS)).toEqual([
            { value: 'trpc', count: 2 },
            { value: 'forceSignOut', count: 1 },
            { value: 'syncBankBalance', count: 1 },
        ])
    })
})

describe('buildHistogramBuckets', () => {
    it('creates evenly spaced buckets ending at the fetch time', () => {
        const buckets = buildHistogramBuckets([], '1h', END)

        expect(buckets).toHaveLength(LOGS_HISTOGRAM_BUCKETS)
        expect(buckets[0].start).toBe(END - 3_600_000)
        expect(buckets[1].start - buckets[0].start).toBe(3_600_000 / LOGS_HISTOGRAM_BUCKETS)
    })

    it('counts logs per level in their bucket and clamps out-of-range ones', () => {
        const buckets = buildHistogramBuckets(
            [
                ...LOGS,
                makeLog({ level: LogLevel.Debug, created_at: new Date(END + 5000).toISOString() }),
                makeLog({ level: LogLevel.Debug, created_at: new Date(0).toISOString() }),
            ],
            '1h',
            END
        )
        const last = buckets.at(-1)!

        expect(last).toMatchObject({ error: 2, warn: 1, info: 1, debug: 1 })
        expect(buckets[0].debug).toBe(1)
    })
})

describe('getLogErrorSummary', () => {
    it('reads the tagged error summary from metadata', () => {
        const log = makeLog({
            metadata: { error: { _tag: 'SbQueryError', error_hash: 'j2tb6x9q' } },
        })

        expect(getLogErrorSummary(log)).toEqual({ tag: 'SbQueryError', hash: 'j2tb6x9q' })
    })

    it('returns an empty summary without an error object', () => {
        expect(getLogErrorSummary(makeLog({ metadata: { path: 'a.webp' } }))).toEqual({})
        expect(getLogErrorSummary(makeLog({ metadata: null }))).toEqual({})
    })
})
