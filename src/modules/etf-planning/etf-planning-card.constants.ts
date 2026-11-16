import { Ticker } from '@/types/core/Ticker'

// Target weight per ETF `ticker_id` in % (should add up to 100), one line per ETF.
// Keyed by string because ETFs added in-app are not all in the `Ticker` enum
export const ETF_TARGET_ALLOCATION = {
    [Ticker.VUAA]: 65,
    [Ticker.QDVE]: 25,
    [Ticker.SEC0]: 10,
} satisfies Record<string, number>

export const TARGET_TOTAL_PCT = 100

// Drift (in percentage points) under which an ETF counts as on target
export const BALANCED_TOLERANCE_PCT = 1

// Buys below this amount are treated as noise and not suggested
export const MIN_BUY_EUR = 1

export const DRIFT_STATUS_LABEL = {
    'on-target': 'On target',
    under: 'Under',
    over: 'Over',
} as const

export const DRIFT_STATUS_CLASS = {
    'on-target': 'text-success',
    under: 'text-warning',
    over: 'text-destructive',
} as const
