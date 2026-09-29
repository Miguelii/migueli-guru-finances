import { describe, it, expect } from 'vitest'
import { getTopMovers } from '@/modules/top-performers/top-performers-card.helpers'
import { Ticker, TickerType } from '@/types/Transaction'
import type { HoldingSummary } from '@/types/Holding'

const holding = (
    ticker_id: Ticker,
    unrealized_gl_eur_pct: number,
    overrides: Partial<HoldingSummary> = {}
) =>
    ({
        ticker_id,
        tickerType: TickerType.Crypto,
        total_quantity: 1,
        unrealized_gl_eur_pct,
        ...overrides,
    }) as HoldingSummary

describe('getTopMovers', () => {
    it('should return empty lists for no holdings', () => {
        expect(getTopMovers([], 3)).toEqual({ best: [], worst: [] })
    })

    it('should rank best descending and worst ascending', () => {
        const { best, worst } = getTopMovers(
            [
                holding(Ticker.ETH, 10),
                holding(Ticker.BTC, 50),
                holding(Ticker.SOL, -20),
                holding(Ticker.VUAA, 5),
            ],
            2
        )

        expect(best.map((h) => h.ticker_id)).toEqual([Ticker.BTC, Ticker.ETH])
        expect(worst.map((h) => h.ticker_id)).toEqual([Ticker.SOL, Ticker.VUAA])
    })

    it('should never list a position twice', () => {
        const { best, worst } = getTopMovers(
            [holding(Ticker.ETH, 10), holding(Ticker.BTC, 50), holding(Ticker.SOL, -20)],
            2
        )

        expect(best.map((h) => h.ticker_id)).toEqual([Ticker.BTC, Ticker.ETH])
        expect(worst.map((h) => h.ticker_id)).toEqual([Ticker.SOL])
    })

    it('should ignore closed positions and FX holdings', () => {
        const { best, worst } = getTopMovers(
            [
                holding(Ticker.ETH, 10, { total_quantity: 0 }),
                holding(Ticker.USD_EUR, 99, { tickerType: TickerType.Cambio }),
                holding(Ticker.BTC, 1),
            ],
            3
        )

        expect(best.map((h) => h.ticker_id)).toEqual([Ticker.BTC])
        expect(worst).toEqual([])
    })
})
