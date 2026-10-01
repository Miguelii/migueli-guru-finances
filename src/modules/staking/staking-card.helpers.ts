import type { HoldingSummary } from '@/types/Holding'
import type { Ticker } from '@/types/Transaction'
import { MONTHS_PER_YEAR } from '@/modules/staking/staking-card.constants'

export type StakingYield = {
    holding: HoldingSummary
    apy: number
    yearlyTokens: number
    yearlyEur: number
    monthlyEur: number
}

export type StakingTotals = {
    yearlyEur: number
    monthlyEur: number
    stakedEur: number
}

/**
 * Estimated yearly staking rewards per open position with an APY, assuming the whole
 * position is staked and rewards are not compounded. Sorted by yearly EUR, highest first.
 * @param holdings - All holding summaries (EUR values already converted).
 * @param apyByTicker - Yearly rate per ticker (`0.025` = 2.5%).
 */
export function getStakingYields(
    holdings: HoldingSummary[],
    apyByTicker: Partial<Record<Ticker, number>>
): StakingYield[] {
    return holdings
        .flatMap((holding) => {
            const apy = apyByTicker[holding.ticker_id]

            if (apy === undefined || holding.total_quantity <= 0) return []

            const yearlyEur = holding.current_value_eur * apy

            return [
                {
                    holding,
                    apy,
                    yearlyTokens: holding.total_quantity * apy,
                    yearlyEur,
                    monthlyEur: yearlyEur / MONTHS_PER_YEAR,
                },
            ]
        })
        .toSorted((a, b) => b.yearlyEur - a.yearlyEur)
}

export function getStakingTotals(yields: StakingYield[]): StakingTotals {
    const yearlyEur = yields.reduce((sum, item) => sum + item.yearlyEur, 0)
    const stakedEur = yields.reduce((sum, item) => sum + item.holding.current_value_eur, 0)

    return { yearlyEur, monthlyEur: yearlyEur / MONTHS_PER_YEAR, stakedEur }
}
