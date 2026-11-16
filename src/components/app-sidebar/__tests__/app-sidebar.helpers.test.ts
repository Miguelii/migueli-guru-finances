import { describe, expect, it } from 'vitest'
import { getNavCounts } from '@/components/app-sidebar/app-sidebar.helpers'
import type { HoldingSummary } from '@/types/Holding'
import { Currency } from '@/types/core/Currency'
import { Ticker } from '@/types/core/Ticker'
import { TickerType } from '@/types/core/TickerType'

const makeHolding = (overrides: Partial<HoldingSummary>): HoldingSummary => ({
    ticker_id: Ticker.ETH,
    symbol: Ticker.ETH,
    tickerLogo: undefined,
    tickerHexColor: undefined,
    tickerType: TickerType.Crypto,
    currency: Currency.EUR,
    total_quantity: 1,
    total_invested: 100,
    total_fees: 0,
    current_price: 120,
    current_value: 120,
    avg_cost_per_share: 100,
    realized_gl: 0,
    unrealized_gl: 20,
    unrealized_gl_pct: 20,
    unrealized_gl_with_fees: 20,
    unrealized_gl_with_fees_pct: 20,
    total_gl: 20,
    total_gl_pct: 20,
    total_gl_with_fees: 20,
    total_gl_with_fees_pct: 20,
    current_price_eur: 120,
    current_value_eur: 120,
    total_invested_eur: 100,
    total_fees_eur: 0,
    realized_gl_eur: 0,
    unrealized_gl_eur: 20,
    unrealized_gl_eur_pct: 20,
    unrealized_gl_with_fees_eur: 20,
    unrealized_gl_with_fees_eur_pct: 20,
    total_gl_eur: 20,
    ...overrides,
})

const holdings = [
    makeHolding({ ticker_id: Ticker.ETH, symbol: Ticker.ETH, current_value_eur: 200 }),
    makeHolding({ ticker_id: Ticker.BTC, symbol: Ticker.BTC, current_value_eur: 600 }),
    makeHolding({ ticker_id: Ticker.VUAA, symbol: Ticker.VUAA, current_value_eur: 200 }),
    makeHolding({
        ticker_id: Ticker.SOL,
        symbol: Ticker.SOL,
        total_quantity: 0,
        current_value_eur: 0,
    }),
]

describe('getNavCounts', () => {
    it('counts transactions, open positions and watchlist assets', () => {
        const transactions = [{}, {}, {}]
        const data = [{}, {}]

        expect(getNavCounts(transactions, data, holdings)).toEqual({
            positions: 3,
            transactions: 3,
            watchlist: 2,
        })
    })
})
