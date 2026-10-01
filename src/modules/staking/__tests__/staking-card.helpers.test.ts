import { describe, it, expect } from 'vitest'
import { getStakingTotals, getStakingYields } from '@/modules/staking/staking-card.helpers'
import { Ticker } from '@/types/Transaction'
import type { HoldingSummary } from '@/types/Holding'

const holding = (ticker_id: Ticker, total_quantity: number, current_value_eur: number) =>
    ({ ticker_id, total_quantity, current_value_eur }) as HoldingSummary

const APY = { [Ticker.ETH]: 0.025, [Ticker.SOL]: 0.06 }

describe('getStakingYields', () => {
    it('should compute yearly tokens, yearly and monthly EUR from the APY', () => {
        const [eth] = getStakingYields([holding(Ticker.ETH, 2, 6000)], APY)

        expect(eth.apy).toBe(0.025)
        expect(eth.yearlyTokens).toBeCloseTo(0.05)
        expect(eth.yearlyEur).toBeCloseTo(150)
        expect(eth.monthlyEur).toBeCloseTo(12.5)
    })

    it('should ignore assets without an APY and closed positions', () => {
        const yields = getStakingYields(
            [
                holding(Ticker.BTC, 1, 50_000),
                holding(Ticker.SOL, 0, 0),
                holding(Ticker.ETH, 1, 3000),
            ],
            APY
        )

        expect(yields.map((item) => item.holding.ticker_id)).toEqual([Ticker.ETH])
    })

    it('should sort by yearly EUR, highest first', () => {
        const yields = getStakingYields(
            [holding(Ticker.ETH, 1, 1000), holding(Ticker.SOL, 10, 2000)],
            APY
        )

        expect(yields.map((item) => item.holding.ticker_id)).toEqual([Ticker.SOL, Ticker.ETH])
    })

    it('should return an empty list without staked holdings', () => {
        expect(getStakingYields([], APY)).toEqual([])
    })
})

describe('getStakingTotals', () => {
    it('should sum yearly, monthly and staked EUR', () => {
        const totals = getStakingTotals(
            getStakingYields([holding(Ticker.ETH, 2, 6000), holding(Ticker.SOL, 10, 1500)], APY)
        )

        expect(totals.yearlyEur).toBeCloseTo(240)
        expect(totals.monthlyEur).toBeCloseTo(20)
        expect(totals.stakedEur).toBeCloseTo(7500)
    })

    it('should be zero without yields', () => {
        expect(getStakingTotals([])).toEqual({ yearlyEur: 0, monthlyEur: 0, stakedEur: 0 })
    })
})
