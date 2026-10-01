import { Ticker } from '@/types/Transaction'

// Yearly staking rate per asset (0.025 = 2.5%). Set to what the exchange pays, one line per asset
export const STAKING_APY: Partial<Record<Ticker, number>> = {
    [Ticker.ETH]: 0.0286,
    [Ticker.SOL]: 0.064,
}

export const MONTHS_PER_YEAR = 12
