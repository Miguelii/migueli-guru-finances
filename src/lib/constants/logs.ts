export const LOG_RANGES = ['30m', '1h', '24h', '7d', '30d'] as const

export type LogRange = (typeof LOG_RANGES)[number]

export const DEFAULT_LOG_RANGE: LogRange = '1h'

const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

export const LOG_RANGE_MS: Record<LogRange, number> = {
    '30m': 30 * MINUTE_MS,
    '1h': HOUR_MS,
    '24h': DAY_MS,
    '7d': 7 * DAY_MS,
    '30d': 30 * DAY_MS,
}

export const LOG_RANGE_LABEL: Record<LogRange, string> = {
    '30m': 'Last 30 minutes',
    '1h': 'Last hour',
    '24h': 'Last 24 hours',
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
}
