import { describe, it, expect } from 'vitest'
import {
    filterPositionsByType,
    getAvailableTypes,
    getPositionWeight,
    getPositionsTotals,
    getUnrealized,
    sortPositions,
    splitPositions,
} from '@/modules/positions/positions.helpers'
import { Ticker, TickerType } from '@/types/Transaction'
import type { HoldingSummary } from '@/types/Holding'

const holding = (ticker: Ticker, overrides: Partial<HoldingSummary> = {}) =>
    ({
        ticker_id: ticker,
        symbol: ticker,
        tickerType: TickerType.Crypto,
        total_quantity: 1,
        current_value_eur: 100,
        total_invested_eur: 80,
        total_fees_eur: 1,
        realized_gl_eur: 0,
        unrealized_gl_eur: 20,
        unrealized_gl_eur_pct: 25,
        unrealized_gl_with_fees_eur: 19,
        unrealized_gl_with_fees_eur_pct: 23.75,
        total_gl_eur: 20,
        ...overrides,
    }) as HoldingSummary

const ETH = holding(Ticker.ETH, {
    current_value_eur: 300,
    total_gl_eur: 50,
    unrealized_gl_eur_pct: 10,
})
const VUAA = holding(Ticker.VUAA, {
    tickerType: TickerType.Etf,
    current_value_eur: 100,
    total_gl_eur: 80,
    unrealized_gl_eur_pct: 40,
    unrealized_gl_with_fees_eur_pct: 5,
})
const BTC_CLOSED = holding(Ticker.BTC, {
    total_quantity: 0,
    current_value_eur: 0,
    total_invested_eur: 0,
    realized_gl_eur: 120,
    total_fees_eur: 3,
})

describe('splitPositions', () => {
    it('should separate open and closed positions', () => {
        const { open, closed } = splitPositions([ETH, VUAA, BTC_CLOSED])

        expect(open.map((h) => h.ticker_id)).toEqual([Ticker.ETH, Ticker.VUAA])
        expect(closed.map((h) => h.ticker_id)).toEqual([Ticker.BTC])
    })
})

describe('filterPositionsByType', () => {
    it('should keep everything for "all" and filter by type otherwise', () => {
        expect(filterPositionsByType([ETH, VUAA], 'all')).toHaveLength(2)
        expect(filterPositionsByType([ETH, VUAA], TickerType.Etf)).toEqual([VUAA])
    })
})

describe('getAvailableTypes', () => {
    it('should list only present types in display order', () => {
        expect(getAvailableTypes([VUAA, ETH])).toEqual([TickerType.Crypto, TickerType.Etf])
    })
})

describe('getUnrealized', () => {
    it('should switch between the metrics with and without fees', () => {
        expect(getUnrealized(VUAA, false)).toEqual({ value: 20, pct: 40 })
        expect(getUnrealized(VUAA, true)).toEqual({ value: 19, pct: 5 })
    })
})

describe('sortPositions', () => {
    it('should sort by market value, highest first', () => {
        expect(sortPositions([VUAA, ETH], 'value', false).map((h) => h.ticker_id)).toEqual([
            Ticker.ETH,
            Ticker.VUAA,
        ])
    })

    it('should sort by unrealized % following the fees toggle', () => {
        expect(sortPositions([ETH, VUAA], 'unrealized', false)[0].ticker_id).toBe(Ticker.VUAA)
        expect(sortPositions([ETH, VUAA], 'unrealized', true)[0].ticker_id).toBe(Ticker.ETH)
    })

    it('should sort by total G/L and by name', () => {
        expect(sortPositions([ETH, VUAA], 'total_gl', false)[0].ticker_id).toBe(Ticker.VUAA)
        expect(sortPositions([VUAA, ETH], 'name', false)[0].ticker_id).toBe(Ticker.ETH)
    })

    it('should not mutate the input', () => {
        const input = [VUAA, ETH]
        sortPositions(input, 'value', false)

        expect(input[0]).toBe(VUAA)
    })
})

describe('getPositionWeight', () => {
    it('should return the share in percent and 0 for an empty portfolio', () => {
        expect(getPositionWeight(ETH, 400)).toBe(75)
        expect(getPositionWeight(ETH, 0)).toBe(0)
    })
})

describe('getPositionsTotals', () => {
    it('should include closed positions in realized and fees but count only open ones', () => {
        const totals = getPositionsTotals([ETH, VUAA, BTC_CLOSED])

        expect(totals.currentValue).toBe(400)
        expect(totals.totalRealized).toBe(120)
        expect(totals.totalFees).toBe(5)
        expect(totals.count).toBe(2)
    })
})
