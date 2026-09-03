import { describe, expect, it } from 'vitest'
import { createPortfolioOverview } from '@/modules/portfolio-export/portfolio-export.helpers'
import type { HoldingSummary } from '@/types/Holding'
import { Currency, Ticker, TickerType } from '@/types/Transaction'

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

describe('createPortfolioOverview', () => {
    it('groups holdings and uses the chart allocation bases', () => {
        const overview = createPortfolioOverview([
            makeHolding({ symbol: Ticker.ETH, current_value_eur: 600, total_invested_eur: 400 }),
            makeHolding({
                symbol: Ticker.SOL,
                ticker_id: Ticker.SOL,
                current_value_eur: 300,
                total_invested_eur: 100,
            }),
            makeHolding({
                symbol: Ticker.ATCH,
                ticker_id: Ticker.ATCH,
                tickerType: TickerType.Stock,
                current_value_eur: 100,
                total_invested_eur: 500,
            }),
            makeHolding({ tickerType: TickerType.Cambio, symbol: Ticker.USD_EUR }),
        ])

        expect(overview).toBe(
            'CRYPTO - 90,0%\n' +
                'ETH  | allocation 40,0% | invested 400,00 €\n' +
                'SOL  | allocation 10,0% | invested 100,00 €\n\n' +
                'STOCK - 10,0%\n' +
                'ATCH | allocation 50,0% | invested 500,00 €\n\n' +
                'Total Invested: 1000,00 €'
        )
    })

    it('returns an empty string when there are no supported holdings', () => {
        expect(createPortfolioOverview([])).toBe('')
        expect(createPortfolioOverview([makeHolding({ tickerType: TickerType.Cambio })])).toBe('')
    })

    it('does not produce invalid percentages for zero totals', () => {
        const overview = createPortfolioOverview([
            makeHolding({ current_value_eur: 0, total_invested_eur: 0 }),
        ])

        expect(overview).toContain('CRYPTO - 0,0%')
        expect(overview).toContain('allocation 0,0%')
        expect(overview).toContain('Total Invested: 0,00 €')
    })
})
