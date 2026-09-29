import { describe, it, expect } from 'vitest'
import { aggregateHoldings, computePortfolioTotals } from '@/lib/portfolio/calculations'
import { buildInvestedTimeline } from '@/lib/portfolio/invested-timeline'
import type { CambioRates, Transaction, TickerData } from '@/types/Transaction'
import { TransactionType, Ticker, Currency, TickerService, TickerType } from '@/types/Transaction'

const rates: CambioRates = { usdToEur: 0.85, usdcToEur: 0.9 }

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeTd = (overrides: Partial<TickerData> & { ticker: Ticker }): TickerData => ({
    curr_price: 0,
    last_updated_at: '2026-03-17 10:00:00',
    service: TickerService.Coinbase,
    currency: Currency.EUR,
    symbol: '€',
    logo: '/assets/ethereum.webp',
    hex_color: '#627EEA' as TickerData['hex_color'],
    type: TickerType.Crypto,
    ...overrides,
})

const makeTx = (
    overrides: Partial<Transaction> & { id: string; ticker_id: Ticker }
): Transaction => ({
    type: TransactionType.Buy,
    buy_date: '2026-01-01 10:00:00',
    fee: 0,
    ...overrides,
})

const ethTd = makeTd({ ticker: Ticker.ETH, curr_price: 2000 })

// ─── buildInvestedTimeline ───────────────────────────────────────────────────

describe('buildInvestedTimeline', () => {
    const now = new Date(2026, 2, 15)

    it('should return an empty array for no transactions', () => {
        expect(buildInvestedTimeline([], [ethTd], rates, now)).toEqual([])
    })

    it('should start at zero the month before the first transaction', () => {
        const txs = [
            makeTx({
                id: '1',
                ticker_id: Ticker.ETH,
                value: 1000,
                quantity: 1,
                buy_date: '2026-01-10 10:00:00',
            }),
        ]
        const result = buildInvestedTimeline(txs, [ethTd], rates, now)

        expect(result.map((p) => p.month)).toEqual(['2025-12', '2026-01', '2026-02', '2026-03'])
        expect(result.map((p) => p.investedEur)).toEqual([0, 1000, 1000, 1000])
    })

    it('should reduce the invested capital on sells and be order independent', () => {
        const txs = [
            makeTx({
                id: '2',
                ticker_id: Ticker.ETH,
                type: TransactionType.Sell,
                value: 800,
                quantity: 0.5,
                buy_date: '2026-03-01 10:00:00',
            }),
            makeTx({
                id: '1',
                ticker_id: Ticker.ETH,
                value: 1000,
                quantity: 1,
                buy_date: '2026-02-01 10:00:00',
            }),
        ]
        const result = buildInvestedTimeline(txs, [ethTd], rates, now)

        expect(result.map((p) => p.investedEur)).toEqual([0, 1000, 500])
    })

    it('should end at the current invested capital of the holdings', () => {
        const usdTd = makeTd({ ticker: Ticker.VUAA, currency: Currency.USD, curr_price: 100 })
        const txs = [
            makeTx({
                id: '1',
                ticker_id: Ticker.VUAA,
                value: 1000,
                quantity: 10,
                exchange_rate: 0.9,
                buy_date: '2025-11-03 10:00:00',
            }),
            makeTx({
                id: '2',
                ticker_id: Ticker.ETH,
                value: 400,
                quantity: 0.2,
                buy_date: '2026-02-20 10:00:00',
            }),
        ]
        const timeline = buildInvestedTimeline(txs, [ethTd, usdTd], rates, now)
        const holdings = aggregateHoldings(txs, [ethTd, usdTd], rates)

        expect(timeline.at(-1)!.investedEur).toBeCloseTo(
            computePortfolioTotals(holdings).totalInvested
        )
    })
})
