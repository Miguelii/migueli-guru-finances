import { describe, it, expect } from 'vitest'
import {
    formatDrift,
    getAllocationSegments,
    getDriftStatus,
    getEtfPlan,
    getEtfPositions,
    getInitialTargetInputs,
    getTargetSplitLabel,
    isSuggestedBuy,
    parseAmountInput,
    parsePercentInput,
    parseTargetInputs,
    toUnits,
} from '@/modules/etf-planning/etf-planning-card.helpers'
import { Ticker } from '@/types/core/Ticker'
import { TickerType } from '@/types/core/TickerType'
import type { HoldingSummary } from '@/types/Holding'

const etf = (
    ticker_id: string,
    current_value_eur: number,
    total_quantity = 10,
    tickerType = TickerType.Etf
) =>
    ({
        ticker_id: ticker_id as Ticker,
        current_value_eur,
        current_price_eur: total_quantity > 0 ? current_value_eur / total_quantity : 50,
        total_quantity,
        tickerType,
    }) as HoldingSummary

const rowOf = (plan: ReturnType<typeof getEtfPlan>, tickerId: string) =>
    plan.rows.find((row) => row.holding.ticker_id === tickerId)!

describe('getEtfPositions', () => {
    it('should keep open ETF positions only, highest value first', () => {
        const positions = getEtfPositions(
            [
                etf(Ticker.BTC, 9000, 1, TickerType.Crypto),
                etf('CLOSED', 0, 0),
                etf('SMALL', 100),
                etf('BIG', 5000),
            ],
            [],
            {}
        )

        expect(positions.map((holding) => holding.ticker_id)).toEqual(['BIG', 'SMALL'])
    })

    it('should add targeted ETFs not held yet, never-bought or sold out', () => {
        const positions = getEtfPositions(
            [etf(Ticker.VUAA, 6000), etf('SOLD', 0, 0)],
            [etf(Ticker.SEC0, 0, 0), etf('OTHER', 0, 0), etf(Ticker.BTC, 0, 0, TickerType.Crypto)],
            { [Ticker.VUAA]: 60, SOLD: 25, [Ticker.SEC0]: 15, [Ticker.BTC]: 10 }
        )

        expect(positions.map((holding) => holding.ticker_id)).toEqual([
            Ticker.VUAA,
            'SOLD',
            Ticker.SEC0,
        ])
    })
})

describe('getInitialTargetInputs', () => {
    it('should default ETFs missing from the targets to 0', () => {
        expect(getInitialTargetInputs([etf('A', 1), etf('B', 1)], { A: 60 })).toEqual({
            A: '60',
            B: '0',
        })
    })
})

describe('input parsing', () => {
    it('should parse and clamp percentages', () => {
        expect(parsePercentInput('42,5')).toBe(42.5)
        expect(parsePercentInput('150')).toBe(100)
        expect(parsePercentInput('-5')).toBe(0)
        expect(parsePercentInput('abc')).toBe(0)
    })

    it('should parse amounts, invalid or negative as 0', () => {
        expect(parseAmountInput('250,75')).toBe(250.75)
        expect(parseAmountInput('-10')).toBe(0)
        expect(parseAmountInput('')).toBe(0)
    })

    it('should parse every target input', () => {
        expect(parseTargetInputs({ A: '60', B: 'x' })).toEqual({ A: 60, B: 0 })
    })
})

describe('getEtfPlan', () => {
    it('should only buy the underweight ETF to reach a 60/40 split', () => {
        const plan = getEtfPlan([etf('A', 5000), etf('B', 5000)], { A: 60, B: 40 }, 0)
        const a = rowOf(plan, 'A')
        const b = rowOf(plan, 'B')

        // B at 5000 is the 40% → balanced total 12 500, A needs 7500
        expect(a.buyToBalanceEur).toBeCloseTo(2500)
        expect(b.buyToBalanceEur).toBeCloseTo(0)
        expect(plan.minBuyToBalanceEur).toBeCloseTo(2500)
        expect(a.currentPct).toBeCloseTo(50)
        expect(a.driftPct).toBeCloseTo(-10)
        expect(b.driftPct).toBeCloseTo(10)
        expect(plan.isBalanced).toBe(false)
    })

    it('should not suggest buys when already balanced', () => {
        const plan = getEtfPlan([etf('A', 6000), etf('B', 4000)], { A: 60, B: 40 }, 0)

        expect(plan.minBuyToBalanceEur).toBeCloseTo(0)
        expect(plan.isBalanced).toBe(true)
    })

    it('should put a contribution below the minimum buy only into the most underweight ETF', () => {
        const plan = getEtfPlan(
            [etf('A', 5000), etf('B', 5000), etf('C', 2000)],
            { A: 50, B: 30, C: 20 },
            1000
        )

        // Ratios (value / weight): A 10 000, B 16 667, C 10 000 → A and C are filled together
        expect(rowOf(plan, 'A').buyWithContributionEur).toBeCloseTo(714.29, 1)
        expect(rowOf(plan, 'C').buyWithContributionEur).toBeCloseTo(285.71, 1)
        expect(rowOf(plan, 'B').buyWithContributionEur).toBe(0)
    })

    it('should land exactly on target when the contribution covers the minimum buy', () => {
        const plan = getEtfPlan([etf('A', 5000), etf('B', 5000)], { A: 60, B: 40 }, 5000)

        // Final total 15 000 → A 9000, B 6000
        expect(rowOf(plan, 'A').buyWithContributionEur).toBeCloseTo(4000)
        expect(rowOf(plan, 'B').buyWithContributionEur).toBeCloseTo(1000)
    })

    it('should always split the whole contribution', () => {
        const plan = getEtfPlan(
            [etf('A', 1234), etf('B', 8765), etf('C', 300)],
            { A: 40, B: 35, C: 25 },
            777
        )
        const invested = plan.rows.reduce((sum, row) => sum + row.buyWithContributionEur, 0)

        expect(invested).toBeCloseTo(777)
    })

    it('should normalise targets that do not add up to 100', () => {
        const plan = getEtfPlan([etf('A', 5000), etf('B', 5000)], { A: 30, B: 20 }, 0)

        expect(plan.targetsSumPct).toBe(50)
        expect(rowOf(plan, 'A').buyToBalanceEur).toBeCloseTo(2500)
        expect(getTargetSplitLabel(plan)).toBe('60/40')
    })

    it('should list held ETFs with a 0% target and never buy them', () => {
        const plan = getEtfPlan([etf('A', 5000), etf('B', 1000)], { A: 100 }, 500)

        expect(plan.untargetedHeld.map((holding) => holding.ticker_id)).toEqual(['B'])
        expect(rowOf(plan, 'B').buyWithContributionEur).toBe(0)
        expect(rowOf(plan, 'A').buyWithContributionEur).toBeCloseTo(500)
        expect(plan.isBalanced).toBe(false)
    })

    it('should use the EUR unit price for each ETF', () => {
        const plan = getEtfPlan([etf('A', 5000, 50)], { A: 100 }, 0)

        expect(rowOf(plan, 'A').unitPriceEur).toBe(100)
    })

    it('should buy a targeted ETF not held yet up to its share', () => {
        // 60/25/15 with SEC0 never bought: QDVE (2500 = 25%) is on target, VUAA overweight
        const plan = getEtfPlan(
            [etf(Ticker.VUAA, 7500), etf(Ticker.QDVE, 2500), etf(Ticker.SEC0, 0, 0)],
            { [Ticker.VUAA]: 60, [Ticker.QDVE]: 25, [Ticker.SEC0]: 15 },
            0
        )
        const sec0 = rowOf(plan, Ticker.SEC0)

        // VUAA sets the size: 7500 / 0.6 = 12 500 → QDVE 3125, SEC0 1875
        expect(sec0.isHeld).toBe(false)
        expect(sec0.driftPct).toBeCloseTo(-15)
        expect(sec0.buyToBalanceEur).toBeCloseTo(1875)
        expect(rowOf(plan, Ticker.QDVE).buyToBalanceEur).toBeCloseTo(625)
        expect(plan.untargetedHeld).toEqual([])
        expect(plan.isBalanced).toBe(false)
    })

    it('should put a contribution into the ETF not held yet first', () => {
        const plan = getEtfPlan(
            [etf(Ticker.VUAA, 6000), etf(Ticker.QDVE, 2500), etf(Ticker.SEC0, 0, 0)],
            { [Ticker.VUAA]: 60, [Ticker.QDVE]: 25, [Ticker.SEC0]: 15 },
            500
        )

        expect(rowOf(plan, Ticker.SEC0).buyWithContributionEur).toBeCloseTo(500)
        expect(rowOf(plan, Ticker.VUAA).buyWithContributionEur).toBe(0)
        expect(rowOf(plan, Ticker.QDVE).buyWithContributionEur).toBe(0)
    })

    it('should not flag an ETF not held yet whose target was set to 0', () => {
        const plan = getEtfPlan(
            [etf(Ticker.VUAA, 6000), etf(Ticker.SEC0, 0, 0)],
            { [Ticker.VUAA]: 100 },
            0
        )

        expect(plan.untargetedHeld).toEqual([])
        expect(plan.isBalanced).toBe(true)
    })

    it('should return an empty plan without targets', () => {
        const plan = getEtfPlan([etf('A', 5000)], {}, 100)

        expect(plan.minBuyToBalanceEur).toBe(0)
        expect(plan.isBalanced).toBe(false)
        expect(getTargetSplitLabel(plan)).toBe('')
    })
})

describe('toUnits', () => {
    it('should convert EUR to units, 0 without a price', () => {
        expect(toUnits(250, 50)).toBe(5)
        expect(toUnits(250, 0)).toBe(0)
    })
})

describe('isSuggestedBuy', () => {
    it('should ignore buys under 1 €', () => {
        expect(isSuggestedBuy(0.4)).toBe(false)
        expect(isSuggestedBuy(25)).toBe(true)
    })
})

describe('getDriftStatus', () => {
    it('should flag drifts outside the 1 pp tolerance', () => {
        expect(getDriftStatus(0.5)).toBe('on-target')
        expect(getDriftStatus(-3)).toBe('under')
        expect(getDriftStatus(4)).toBe('over')
    })
})

describe('formatDrift', () => {
    it('should sign positive drifts', () => {
        expect(formatDrift(10)).toBe('+10.0 pp')
        expect(formatDrift(-2.54)).toBe('-2.5 pp')
    })
})

describe('getAllocationSegments', () => {
    it('should build the current and the normalised target splits', () => {
        const plan = getEtfPlan([etf('A', 7500), etf('B', 2500)], { A: 30, B: 20 }, 0)

        expect(getAllocationSegments(plan, 'current').map((segment) => segment.pct)).toEqual([
            75, 25,
        ])
        expect(getAllocationSegments(plan, 'target').map((segment) => segment.pct)).toEqual([
            60, 40,
        ])
    })

    it('should leave out ETFs at 0%', () => {
        const plan = getEtfPlan([etf('A', 5000), etf('B', 5000)], { A: 100 }, 0)

        expect(getAllocationSegments(plan, 'target').map((segment) => segment.tickerId)).toEqual([
            'A',
        ])
    })
})
