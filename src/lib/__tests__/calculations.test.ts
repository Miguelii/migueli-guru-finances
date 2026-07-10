import { describe, it, expect } from 'vitest'
import {
    aggregateHoldings,
    aggregateMonthlyPurchases,
    computePortfolioTotals,
} from '@/lib/calculations'
import type { CambioRates, Transaction, TickerData } from '@/types/Transaction'
import { TransactionType, Ticker, Currency } from '@/types/Transaction'

const rates: CambioRates = { usdToEur: 0.85, usdcToEur: 0.9 }

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeTd = (overrides: Partial<TickerData> & { ticker: Ticker }): TickerData => ({
    curr_price: 0,
    last_updated_at: '2026-03-17 10:00:00',
    service: 'coinbase',
    currency: Currency.EUR,
    symbol: '€',
    logo: '/assets/ethereum.webp',
    hex_color: '#627EEA' as TickerData['hex_color'],
    type: 'CRYPTO',
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
const solTd = makeTd({ ticker: Ticker.SOL, curr_price: 100, logo: '/assets/solana.webp' })

// ─── aggregateHoldings — empty / basic ───────────────────────────────────────

describe('aggregateHoldings', () => {
    it('should return empty array for no transactions', () => {
        expect(aggregateHoldings([], [ethTd], rates)).toEqual([])
    })

    it('should return one holding per ticker', () => {
        const txs: Transaction[] = [
            makeTx({ id: '1', ticker_id: Ticker.ETH, value: 1000, quantity: 0.5 }),
            makeTx({ id: '2', ticker_id: Ticker.SOL, value: 500, quantity: 5 }),
        ]
        const result = aggregateHoldings(txs, [ethTd, solTd], rates)

        expect(result).toHaveLength(2)
        expect(result.map((h) => h.ticker_id)).toContain(Ticker.ETH)
        expect(result.map((h) => h.ticker_id)).toContain(Ticker.SOL)
    })

    it('should map ticker metadata (logo, hex_color, currency)', () => {
        const txs = [makeTx({ id: '1', ticker_id: Ticker.ETH, value: 100, quantity: 0.05 })]
        const [h] = aggregateHoldings(txs, [ethTd], rates)

        expect(h.tickerLogo).toBe('/assets/ethereum.webp')
        expect(h.tickerHexColor).toBe('#627EEA')
        expect(h.currency).toBe('EUR')
        expect(h.symbol).toBe(Ticker.ETH)
    })

    it('should fall back to EUR when ticker data is missing', () => {
        const txs = [makeTx({ id: '1', ticker_id: Ticker.BTC, value: 5000, quantity: 0.1 })]
        const [h] = aggregateHoldings(txs, [], rates)

        expect(h.currency).toBe('EUR')
        expect(h.current_price).toBe(0)
        expect(h.current_value).toBe(0)
    })
})

// ─── BUY transactions (cost basis) ──────────────────────────────────────────

describe('aggregateHoldings — BUY', () => {
    it('should compute basic metrics for a single BUY', () => {
        const txs = [makeTx({ id: '1', ticker_id: Ticker.ETH, value: 1000, quantity: 0.5, fee: 5 })]
        const [h] = aggregateHoldings(txs, [ethTd], rates)

        expect(h.total_quantity).toBe(0.5)
        expect(h.total_invested).toBe(1000)
        expect(h.total_fees).toBe(5)
        expect(h.current_price).toBe(2000)
        expect(h.current_value).toBe(1000) // 0.5 * 2000
        expect(h.avg_cost_per_share).toBe(2000) // 1000 / 0.5
    })

    it('should compute DCA across multiple BUYs', () => {
        const txs: Transaction[] = [
            makeTx({ id: '1', ticker_id: Ticker.ETH, value: 1000, quantity: 0.5, fee: 5 }),
            makeTx({ id: '2', ticker_id: Ticker.ETH, value: 3000, quantity: 1, fee: 10 }),
        ]
        const [h] = aggregateHoldings(txs, [ethTd], rates)

        expect(h.total_quantity).toBeCloseTo(1.5)
        expect(h.total_invested).toBeCloseTo(4000)
        expect(h.total_fees).toBeCloseTo(15)
        expect(h.avg_cost_per_share).toBeCloseTo(4000 / 1.5, 2) // ~2666.67
    })

    it('should handle BUY with zero quantity', () => {
        const txs = [makeTx({ id: '1', ticker_id: Ticker.ETH, value: 0, quantity: 0, fee: 0 })]
        const [h] = aggregateHoldings(txs, [ethTd], rates)

        expect(h.total_quantity).toBe(0)
        expect(h.avg_cost_per_share).toBe(0)
    })

    it('should handle BUY with undefined quantity/value', () => {
        const txs = [makeTx({ id: '1', ticker_id: Ticker.ETH, fee: 2 })]
        const [h] = aggregateHoldings(txs, [ethTd], rates)

        expect(h.total_quantity).toBe(0)
        expect(h.total_invested).toBe(0)
        expect(h.total_fees).toBe(2)
    })
})

// ─── REWARD transactions ────────────────────────────────────────────────────

describe('aggregateHoldings — REWARD', () => {
    it('should increase quantity without increasing invested', () => {
        const txs: Transaction[] = [
            makeTx({ id: '1', ticker_id: Ticker.ETH, value: 1000, quantity: 0.5 }),
            makeTx({ id: '2', ticker_id: Ticker.ETH, type: TransactionType.Reward, quantity: 0.1 }),
        ]
        const [h] = aggregateHoldings(txs, [ethTd], rates)

        expect(h.total_quantity).toBeCloseTo(0.6)
        expect(h.total_invested).toBeCloseTo(1000)
    })

    it('should lower avg cost per share when reward tokens are added', () => {
        const txs: Transaction[] = [
            makeTx({ id: '1', ticker_id: Ticker.ETH, value: 1000, quantity: 0.5 }),
            makeTx({ id: '2', ticker_id: Ticker.ETH, type: TransactionType.Reward, quantity: 0.5 }),
        ]
        const [h] = aggregateHoldings(txs, [ethTd], rates)

        // Without sell, avgCostPerShare = totalInvested / totalQuantity = 1000 / 1.0
        expect(h.avg_cost_per_share).toBeCloseTo(1000)
    })
})

// ─── FEE transactions ───────────────────────────────────────────────────────

describe('aggregateHoldings — FEE', () => {
    it('should accumulate fees from all transaction types', () => {
        const txs: Transaction[] = [
            makeTx({ id: '1', ticker_id: Ticker.ETH, value: 1000, quantity: 0.5, fee: 5 }),
            makeTx({ id: '2', ticker_id: Ticker.ETH, type: TransactionType.Fee, fee: 10 }),
            makeTx({
                id: '3',
                ticker_id: Ticker.ETH,
                type: TransactionType.Reward,
                quantity: 0.1,
                fee: 2,
            }),
        ]
        const [h] = aggregateHoldings(txs, [ethTd], rates)

        expect(h.total_fees).toBe(17)
    })

    it('should affect unrealized G/L with fees', () => {
        const txs = [
            makeTx({ id: '1', ticker_id: Ticker.ETH, value: 1000, quantity: 0.5, fee: 50 }),
        ]
        const [h] = aggregateHoldings(txs, [ethTd], rates)

        // current_value = 0.5 * 2000 = 1000
        // unrealized_gl = 1000 - 1000 = 0
        // unrealized_gl_with_fees = 1000 - (1000 + 50) = -50
        expect(h.unrealized_gl).toBeCloseTo(0)
        expect(h.unrealized_gl_with_fees).toBeCloseTo(-50)
    })
})

// ─── SELL transactions (realized G/L) ───────────────────────────────────────

describe('aggregateHoldings — SELL', () => {
    it('should compute realized gain on profitable sell', () => {
        const txs: Transaction[] = [
            makeTx({ id: '1', ticker_id: Ticker.ETH, value: 2000, quantity: 1 }),
            makeTx({
                id: '2',
                ticker_id: Ticker.ETH,
                type: TransactionType.Sell,
                transaction_price: 3000,
                quantity: 0.5,
            }),
        ]
        const [h] = aggregateHoldings(txs, [ethTd], rates)

        // lot cost = 2000/unit, costOfSold = 2000 * 0.5 = 1000
        // realizedGl = 1500 - 1000 = 500
        expect(h.realized_gl).toBeCloseTo(500)
        expect(h.total_quantity).toBeCloseTo(0.5)
        expect(h.total_invested).toBeCloseTo(1000) // 2000 - 1000
    })

    it('should compute realized loss on unprofitable sell', () => {
        const txs: Transaction[] = [
            makeTx({ id: '1', ticker_id: Ticker.ETH, value: 2000, quantity: 1 }),
            makeTx({
                id: '2',
                ticker_id: Ticker.ETH,
                type: TransactionType.Sell,
                transaction_price: 1000,
                quantity: 0.5,
            }),
        ]
        const [h] = aggregateHoldings(txs, [ethTd], rates)

        // costOfSold = 2000 * 0.5 = 1000, realizedGl = 500 - 1000 = -500
        expect(h.realized_gl).toBeCloseTo(-500)
    })

    it('should handle selling entire position', () => {
        const txs: Transaction[] = [
            makeTx({ id: '1', ticker_id: Ticker.ETH, value: 2000, quantity: 1 }),
            makeTx({
                id: '2',
                ticker_id: Ticker.ETH,
                type: TransactionType.Sell,
                transaction_price: 3000,
                quantity: 1,
            }),
        ]
        const [h] = aggregateHoldings(txs, [ethTd], rates)

        expect(h.total_quantity).toBeCloseTo(0)
        expect(h.realized_gl).toBeCloseTo(1000)
        expect(h.current_value).toBeCloseTo(0)
        expect(h.unrealized_gl).toBeCloseTo(0)
    })

    it('should handle multiple partial sells', () => {
        const txs: Transaction[] = [
            makeTx({ id: '1', ticker_id: Ticker.ETH, value: 4000, quantity: 2 }),
            makeTx({
                id: '2',
                ticker_id: Ticker.ETH,
                type: TransactionType.Sell,
                transaction_price: 3000,
                quantity: 0.5,
            }),
            makeTx({
                id: '3',
                ticker_id: Ticker.ETH,
                type: TransactionType.Sell,
                transaction_price: 5000,
                quantity: 0.5,
            }),
        ]
        const [h] = aggregateHoldings(txs, [ethTd], rates)

        // lot cost = 2000/unit, each sell cost = 2000 * 0.5 = 1000
        // sell1 realized = 1500 - 1000 = 500
        // sell2 realized = 2500 - 1000 = 1500
        expect(h.realized_gl).toBeCloseTo(2000)
        expect(h.total_quantity).toBeCloseTo(1)
        expect(h.total_invested).toBeCloseTo(2000)
    })
})

// ─── FIFO lot accounting ────────────────────────────────────────────────────

describe('aggregateHoldings — FIFO', () => {
    it('should not let a later buy change the realized G/L of an earlier sell', () => {
        const txs: Transaction[] = [
            makeTx({
                id: '1',
                ticker_id: Ticker.ETH,
                value: 2000,
                quantity: 1,
                buy_date: '2026-01-01 10:00:00',
            }),
            makeTx({
                id: '2',
                ticker_id: Ticker.ETH,
                type: TransactionType.Sell,
                value: 3000,
                quantity: 1,
                buy_date: '2026-02-01 10:00:00',
            }),
            makeTx({
                id: '3',
                ticker_id: Ticker.ETH,
                value: 4000,
                quantity: 1,
                buy_date: '2026-03-01 10:00:00',
            }),
        ]
        const [h] = aggregateHoldings(txs, [ethTd], rates)

        // sell consumed the 2000 lot: realized = 3000 - 2000 = 1000
        // remaining position is only the later 4000 buy
        expect(h.realized_gl).toBeCloseTo(1000)
        expect(h.total_invested).toBeCloseTo(4000)
        expect(h.avg_cost_per_share).toBeCloseTo(4000)
        // current_value = 1 * 2000, unrealized = 2000 - 4000 = -2000
        expect(h.unrealized_gl).toBeCloseTo(-2000)
        expect(h.total_gl).toBeCloseTo(-1000)
    })

    it('should consume the oldest lots first when a sell spans multiple lots', () => {
        const txs: Transaction[] = [
            makeTx({
                id: '1',
                ticker_id: Ticker.ETH,
                value: 1000,
                quantity: 1,
                buy_date: '2026-01-01 10:00:00',
            }),
            makeTx({
                id: '2',
                ticker_id: Ticker.ETH,
                value: 2000,
                quantity: 1,
                buy_date: '2026-02-01 10:00:00',
            }),
            makeTx({
                id: '3',
                ticker_id: Ticker.ETH,
                type: TransactionType.Sell,
                value: 4500,
                quantity: 1.5,
                buy_date: '2026-03-01 10:00:00',
            }),
        ]
        const [h] = aggregateHoldings(txs, [ethTd], rates)

        // costOfSold = 1 * 1000 + 0.5 * 2000 = 2000, realized = 4500 - 2000 = 2500
        // remaining: 0.5 units from the 2000/unit lot
        expect(h.realized_gl).toBeCloseTo(2500)
        expect(h.total_quantity).toBeCloseTo(0.5)
        expect(h.total_invested).toBeCloseTo(1000)
        expect(h.avg_cost_per_share).toBeCloseTo(2000)
    })

    it('should consume zero-cost reward lots in FIFO order', () => {
        const txs: Transaction[] = [
            makeTx({
                id: '1',
                ticker_id: Ticker.ETH,
                type: TransactionType.Reward,
                quantity: 0.5,
                buy_date: '2026-01-01 10:00:00',
            }),
            makeTx({
                id: '2',
                ticker_id: Ticker.ETH,
                value: 1000,
                quantity: 0.5,
                buy_date: '2026-02-01 10:00:00',
            }),
            makeTx({
                id: '3',
                ticker_id: Ticker.ETH,
                type: TransactionType.Sell,
                value: 1500,
                quantity: 0.75,
                buy_date: '2026-03-01 10:00:00',
            }),
        ]
        const [h] = aggregateHoldings(txs, [ethTd], rates)

        // costOfSold = 0.5 * 0 + 0.25 * 2000 = 500, realized = 1500 - 500 = 1000
        expect(h.realized_gl).toBeCloseTo(1000)
        expect(h.total_quantity).toBeCloseTo(0.25)
        expect(h.total_invested).toBeCloseTo(500)
    })

    it('should not inherit cost from a fully liquidated position after a rebuy', () => {
        const txs: Transaction[] = [
            makeTx({
                id: '1',
                ticker_id: Ticker.ETH,
                value: 1000,
                quantity: 1,
                buy_date: '2026-01-01 10:00:00',
            }),
            makeTx({
                id: '2',
                ticker_id: Ticker.ETH,
                type: TransactionType.Sell,
                value: 2000,
                quantity: 1,
                buy_date: '2026-02-01 10:00:00',
            }),
            makeTx({
                id: '3',
                ticker_id: Ticker.ETH,
                value: 3000,
                quantity: 1,
                buy_date: '2026-03-01 10:00:00',
            }),
        ]
        const [h] = aggregateHoldings(txs, [ethTd], rates)

        expect(h.realized_gl).toBeCloseTo(1000)
        expect(h.total_quantity).toBeCloseTo(1)
        expect(h.total_invested).toBeCloseTo(3000)
        expect(h.avg_cost_per_share).toBeCloseTo(3000)
    })

    it('should produce the same result regardless of input order (Supabase descending)', () => {
        const txs: Transaction[] = [
            makeTx({
                id: '1',
                ticker_id: Ticker.ETH,
                value: 2000,
                quantity: 1,
                buy_date: '2026-01-01 10:00:00',
            }),
            makeTx({
                id: '2',
                ticker_id: Ticker.ETH,
                type: TransactionType.Sell,
                value: 3000,
                quantity: 1,
                buy_date: '2026-02-01 10:00:00',
            }),
            makeTx({
                id: '3',
                ticker_id: Ticker.ETH,
                value: 4000,
                quantity: 1,
                buy_date: '2026-03-01 10:00:00',
            }),
        ]
        const ascending = aggregateHoldings(txs, [ethTd], rates)
        const descending = aggregateHoldings(txs.toReversed(), [ethTd], rates)

        expect(descending).toEqual(ascending)
    })

    it('should process same-date acquisitions before sells', () => {
        // Same buy_date on both — the sell must still find the buy lot
        const txs: Transaction[] = [
            makeTx({
                id: '1',
                ticker_id: Ticker.ETH,
                type: TransactionType.Sell,
                value: 3000,
                quantity: 1,
            }),
            makeTx({ id: '2', ticker_id: Ticker.ETH, value: 2000, quantity: 1 }),
        ]
        const [h] = aggregateHoldings(txs, [ethTd], rates)

        expect(h.realized_gl).toBeCloseTo(1000)
        expect(h.total_quantity).toBeCloseTo(0)
    })

    it('should not produce a negative position when selling more than held', () => {
        const txs: Transaction[] = [
            makeTx({
                id: '1',
                ticker_id: Ticker.ETH,
                value: 1000,
                quantity: 1,
                buy_date: '2026-01-01 10:00:00',
            }),
            makeTx({
                id: '2',
                ticker_id: Ticker.ETH,
                type: TransactionType.Sell,
                value: 4000,
                quantity: 2,
                buy_date: '2026-02-01 10:00:00',
            }),
        ]
        const [h] = aggregateHoldings(txs, [ethTd], rates)

        // only the held quantity carries cost: realized = 4000 - 1000 = 3000
        expect(h.realized_gl).toBeCloseTo(3000)
        expect(h.total_quantity).toBe(0)
        expect(h.total_invested).toBe(0)
    })
})

// ─── Unrealized G/L ─────────────────────────────────────────────────────────

describe('aggregateHoldings — unrealized G/L', () => {
    it('should compute unrealized gain when price is above avg cost', () => {
        // Buy at 1000/unit, current price 2000
        const txs = [makeTx({ id: '1', ticker_id: Ticker.ETH, value: 1000, quantity: 1 })]
        const [h] = aggregateHoldings(txs, [ethTd], rates)

        // current_value = 1 * 2000 = 2000, unrealized = 2000 - 1000 = 1000
        expect(h.unrealized_gl).toBeCloseTo(1000)
        expect(h.unrealized_gl_pct).toBeCloseTo(100)
    })

    it('should compute unrealized loss when price is below avg cost', () => {
        const lowTd = makeTd({ ticker: Ticker.ETH, curr_price: 500 })
        const txs = [makeTx({ id: '1', ticker_id: Ticker.ETH, value: 1000, quantity: 1 })]
        const [h] = aggregateHoldings(txs, [lowTd], rates)

        // current_value = 1 * 500 = 500, unrealized = 500 - 1000 = -500
        expect(h.unrealized_gl).toBeCloseTo(-500)
        expect(h.unrealized_gl_pct).toBeCloseTo(-50)
    })

    it('should be zero when current price equals avg cost', () => {
        const flatTd = makeTd({ ticker: Ticker.ETH, curr_price: 1000 })
        const txs = [makeTx({ id: '1', ticker_id: Ticker.ETH, value: 1000, quantity: 1 })]
        const [h] = aggregateHoldings(txs, [flatTd], rates)

        expect(h.unrealized_gl).toBeCloseTo(0)
        expect(h.unrealized_gl_pct).toBeCloseTo(0)
    })
})

// ─── Total G/L (realized + unrealized) ──────────────────────────────────────

describe('aggregateHoldings — total G/L', () => {
    it('should combine realized and unrealized G/L', () => {
        const txs: Transaction[] = [
            makeTx({ id: '1', ticker_id: Ticker.ETH, value: 2000, quantity: 1 }),
            makeTx({
                id: '2',
                ticker_id: Ticker.ETH,
                type: TransactionType.Sell,
                transaction_price: 3000,
                quantity: 0.5,
            }),
        ]
        const [h] = aggregateHoldings(txs, [ethTd], rates)

        // realized = 1500 - 1000 = 500
        // remaining: 0.5 units, invested 1000, value = 0.5 * 2000 = 1000
        // unrealized = 1000 - 1000 = 0
        // total = 500 + 0 = 500
        expect(h.total_gl).toBeCloseTo(500)
    })

    it('should subtract fees in total_gl_with_fees', () => {
        const txs = [
            makeTx({ id: '1', ticker_id: Ticker.ETH, value: 1000, quantity: 0.5, fee: 25 }),
        ]
        const [h] = aggregateHoldings(txs, [ethTd], rates)

        // unrealized = 1000 - 1000 = 0, total_gl = 0
        // total_gl_with_fees = 0 - 25 = -25
        expect(h.total_gl).toBeCloseTo(0)
        expect(h.total_gl_with_fees).toBeCloseTo(-25)
    })
})

// ─── Percentage calculations (pct edge cases) ───────────────────────────────

describe('aggregateHoldings — percentage edge cases', () => {
    it('should return 0% for unrealized_gl_pct when total_invested is 0', () => {
        // Only rewards, no buys
        const txs = [
            makeTx({ id: '1', ticker_id: Ticker.ETH, type: TransactionType.Reward, quantity: 1 }),
        ]
        const [h] = aggregateHoldings(txs, [ethTd], rates)

        expect(h.total_invested).toBe(0)
        expect(h.unrealized_gl_pct).toBe(0)
    })
})

// ─── Multi-ticker grouping ──────────────────────────────────────────────────

describe('aggregateHoldings — multi-ticker', () => {
    it('should compute holdings independently per ticker', () => {
        const txs: Transaction[] = [
            makeTx({ id: '1', ticker_id: Ticker.ETH, value: 2000, quantity: 1 }),
            makeTx({ id: '2', ticker_id: Ticker.SOL, value: 500, quantity: 5 }),
        ]
        const result = aggregateHoldings(txs, [ethTd, solTd], rates)

        const eth = result.find((h) => h.ticker_id === Ticker.ETH)!
        const sol = result.find((h) => h.ticker_id === Ticker.SOL)!

        expect(eth.total_invested).toBe(2000)
        expect(eth.current_value).toBe(2000) // 1 * 2000

        expect(sol.total_invested).toBe(500)
        expect(sol.current_value).toBe(500) // 5 * 100
    })

    it('should not mix fees between tickers', () => {
        const txs: Transaction[] = [
            makeTx({ id: '1', ticker_id: Ticker.ETH, value: 1000, quantity: 0.5, fee: 10 }),
            makeTx({ id: '2', ticker_id: Ticker.SOL, value: 200, quantity: 2, fee: 3 }),
        ]
        const result = aggregateHoldings(txs, [ethTd, solTd], rates)

        const eth = result.find((h) => h.ticker_id === Ticker.ETH)!
        const sol = result.find((h) => h.ticker_id === Ticker.SOL)!

        expect(eth.total_fees).toBe(10)
        expect(sol.total_fees).toBe(3)
    })
})

// ─── Historical FX (_eur fields) ────────────────────────────────────────────

const monTd = makeTd({
    ticker: Ticker.MON,
    curr_price: 0.02,
    currency: Currency.USDC,
    logo: '/assets/monad.webp',
})

describe('aggregateHoldings — historical FX (_eur fields)', () => {
    it('should convert costs at the historical rate and market value at the current rate', () => {
        const txs: Transaction[] = [
            makeTx({
                id: '1',
                ticker_id: Ticker.MON,
                value: 100,
                quantity: 1000,
                fee: 2,
                exchange_rate: 0.8,
                buy_date: '2026-01-01 10:00:00',
            }),
            makeTx({
                id: '2',
                ticker_id: Ticker.MON,
                type: TransactionType.Sell,
                value: 80,
                quantity: 500,
                fee: 1,
                exchange_rate: 0.9,
                buy_date: '2026-02-01 10:00:00',
            }),
        ]
        const [h] = aggregateHoldings(txs, [monTd], rates)

        // USDC metrics: cost of sold = 500 * 0.1 = 50 → realized = 80 - 50 - 1 = 29
        expect(h.realized_gl).toBeCloseTo(29)
        expect(h.total_invested).toBeCloseTo(50)

        // EUR: lot costs 0.1 * 0.8 = 0.08/unit
        // realized = (80 - 1) * 0.9 - 500 * 0.08 = 71.1 - 40 = 31.1 (fixed at sell time)
        expect(h.realized_gl_eur).toBeCloseTo(31.1)
        // remaining 500 units * 0.08 = 40 — historical, not today's rate
        expect(h.total_invested_eur).toBeCloseTo(40)
        // fees at each transaction's rate: 2 * 0.8 + 1 * 0.9 = 2.5
        expect(h.total_fees_eur).toBeCloseTo(2.5)
        // market value converts at the CURRENT rate: 500 * 0.02 = 10 USDC → 10 * 0.9 = 9
        expect(h.current_value_eur).toBeCloseTo(9)
        expect(h.unrealized_gl_eur).toBeCloseTo(9 - 40)
        // invariant: total = realized + unrealized
        expect(h.total_gl_eur).toBeCloseTo(h.realized_gl_eur + h.unrealized_gl_eur)
    })

    it('should fall back to the current rate when exchange_rate is missing', () => {
        const txs = [makeTx({ id: '1', ticker_id: Ticker.MON, value: 100, quantity: 1000 })]
        const [h] = aggregateHoldings(txs, [monTd], rates)

        // no historical rate recorded → today's usdcToEur (0.9), matching old behavior
        expect(h.total_invested_eur).toBeCloseTo(90)
        expect(h.current_value_eur).toBeCloseTo(18) // 1000 * 0.02 * 0.9
        expect(h.unrealized_gl_eur).toBeCloseTo(-72)
    })

    it('should keep _eur fields equal to base fields for EUR assets', () => {
        const txs: Transaction[] = [
            makeTx({
                id: '1',
                ticker_id: Ticker.ETH,
                value: 2000,
                quantity: 1,
                fee: 5,
                buy_date: '2026-01-01 10:00:00',
            }),
            makeTx({
                id: '2',
                ticker_id: Ticker.ETH,
                type: TransactionType.Sell,
                value: 1500,
                quantity: 0.5,
                fee: 2,
                buy_date: '2026-02-01 10:00:00',
            }),
        ]
        const [h] = aggregateHoldings(txs, [ethTd], rates)

        expect(h.total_invested_eur).toBeCloseTo(h.total_invested)
        expect(h.current_value_eur).toBeCloseTo(h.current_value)
        expect(h.realized_gl_eur).toBeCloseTo(h.realized_gl)
        expect(h.unrealized_gl_eur).toBeCloseTo(h.unrealized_gl)
        expect(h.total_fees_eur).toBeCloseTo(h.total_fees)
        expect(h.total_gl_eur).toBeCloseTo(h.total_gl)
    })
})

// ─── computePortfolioTotals ──────────────────────────────────────────────────

describe('computePortfolioTotals', () => {
    it('should compute totals for holdings with no sells', () => {
        const holdings = [
            {
                ticker_id: Ticker.ETH,
                total_invested_eur: 1000,
                current_value_eur: 2000,
                realized_gl_eur: 0,
            } as any,
        ]
        const result = computePortfolioTotals(holdings)

        expect(result.totalInvested).toBe(1000)
        expect(result.currentValue).toBe(2000)
        expect(result.unrealizedGl).toBe(1000)
        expect(result.unrealizedGlPct).toBe(100)
        expect(result.totalRealized).toBe(0)
    })

    it('should report realized separately from unrealized', () => {
        const holdings = [
            {
                ticker_id: Ticker.ETH,
                total_invested_eur: 500, // After selling half
                current_value_eur: 1000,
                realized_gl_eur: 500, // Profit from selling half
            } as any,
        ]
        const result = computePortfolioTotals(holdings)

        expect(result.totalInvested).toBe(500)
        expect(result.currentValue).toBe(1000)
        expect(result.unrealizedGl).toBe(500) // 1000 - 500 — realized is NOT mixed in
        expect(result.unrealizedGlPct).toBe(100)
        expect(result.totalRealized).toBe(500)
    })

    it('should handle sold everything scenario', () => {
        const holdings = [
            {
                ticker_id: Ticker.ETH,
                total_invested_eur: 0, // Sold everything
                current_value_eur: 0,
                realized_gl_eur: 500, // Profit from selling
            } as any,
        ]
        const result = computePortfolioTotals(holdings)

        expect(result.totalInvested).toBe(0)
        expect(result.currentValue).toBe(0)
        expect(result.unrealizedGl).toBe(0)
        expect(result.unrealizedGlPct).toBe(0) // Since totalInvested is 0
        expect(result.totalRealized).toBe(500)
    })

    it('should sum the precomputed EUR fields across holdings', () => {
        const holdings = [
            {
                ticker_id: Ticker.ETH,
                total_invested_eur: 850,
                current_value_eur: 1700,
                realized_gl_eur: 0,
            } as any,
            {
                ticker_id: Ticker.MON,
                total_invested_eur: 150,
                current_value_eur: 100,
                realized_gl_eur: 50,
            } as any,
        ]
        const result = computePortfolioTotals(holdings)

        expect(result.totalInvested).toBeCloseTo(1000)
        expect(result.currentValue).toBeCloseTo(1800)
        expect(result.unrealizedGl).toBeCloseTo(800)
        expect(result.totalRealized).toBeCloseTo(50)
    })
})

// ─── aggregateMonthlyPurchases ───────────────────────────────────────────────

describe('aggregateMonthlyPurchases', () => {
    it('should return empty array when there are no BUYs in the year', () => {
        const txs = [
            makeTx({ id: '1', ticker_id: Ticker.ETH, value: 100, buy_date: '2025-05-01 10:00:00' }),
        ]
        expect(aggregateMonthlyPurchases(txs, [ethTd], 2026)).toEqual([])
    })

    it('should bucket BUY values into the correct months', () => {
        const txs: Transaction[] = [
            makeTx({ id: '1', ticker_id: Ticker.ETH, value: 100, buy_date: '2026-01-15 10:00:00' }),
            makeTx({ id: '2', ticker_id: Ticker.ETH, value: 50, buy_date: '2026-01-20 10:00:00' }),
            makeTx({ id: '3', ticker_id: Ticker.ETH, value: 200, buy_date: '2026-03-05 10:00:00' }),
        ]
        const [row] = aggregateMonthlyPurchases(txs, [ethTd], 2026)

        expect(row.ticker_id).toBe(Ticker.ETH)
        expect(row.monthly[0]).toBeCloseTo(150)
        expect(row.monthly[1]).toBe(0)
        expect(row.monthly[2]).toBeCloseTo(200)
        expect(row.total).toBeCloseTo(350)
        expect(row.avg).toBeCloseTo(350 / 12)
    })

    it('should ignore SELL, REWARD and FEE transactions', () => {
        const txs: Transaction[] = [
            makeTx({ id: '1', ticker_id: Ticker.ETH, value: 100, buy_date: '2026-01-15 10:00:00' }),
            makeTx({
                id: '2',
                ticker_id: Ticker.ETH,
                value: 500,
                type: TransactionType.Sell,
                buy_date: '2026-02-01 10:00:00',
            }),
            makeTx({
                id: '3',
                ticker_id: Ticker.ETH,
                value: 30,
                type: TransactionType.Reward,
                buy_date: '2026-02-01 10:00:00',
            }),
            makeTx({
                id: '4',
                ticker_id: Ticker.ETH,
                value: 5,
                type: TransactionType.Fee,
                buy_date: '2026-02-01 10:00:00',
            }),
        ]
        const [row] = aggregateMonthlyPurchases(txs, [ethTd], 2026)

        expect(row.total).toBeCloseTo(100)
        expect(row.monthly[1]).toBe(0)
    })

    it('should filter by year', () => {
        const txs: Transaction[] = [
            makeTx({ id: '1', ticker_id: Ticker.ETH, value: 100, buy_date: '2025-06-01 10:00:00' }),
            makeTx({ id: '2', ticker_id: Ticker.ETH, value: 200, buy_date: '2026-06-01 10:00:00' }),
        ]
        const [row2025] = aggregateMonthlyPurchases(txs, [ethTd], 2025)
        const [row2026] = aggregateMonthlyPurchases(txs, [ethTd], 2026)

        expect(row2025.total).toBeCloseTo(100)
        expect(row2026.total).toBeCloseTo(200)
    })

    it('should keep values in the asset currency and expose it on the row', () => {
        const usdTd = makeTd({ ticker: Ticker.SOL, currency: Currency.USD })
        const txs: Transaction[] = [
            makeTx({
                id: '1',
                ticker_id: Ticker.SOL,
                value: 100,
                exchange_rate: 0.8,
                buy_date: '2026-01-10 10:00:00',
            }),
        ]
        const [row] = aggregateMonthlyPurchases(txs, [usdTd], 2026)

        expect(row.currency).toBe(Currency.USD)
        expect(row.monthly[0]).toBeCloseTo(100) // no EUR conversion
    })

    it('should return one row per asset sorted by ticker', () => {
        const txs: Transaction[] = [
            makeTx({ id: '1', ticker_id: Ticker.SOL, value: 100, buy_date: '2026-01-10 10:00:00' }),
            makeTx({ id: '2', ticker_id: Ticker.ETH, value: 100, buy_date: '2026-01-10 10:00:00' }),
        ]
        const result = aggregateMonthlyPurchases(txs, [ethTd, solTd], 2026)

        expect(result.map((r) => r.ticker_id)).toEqual([Ticker.ETH, Ticker.SOL])
    })
})
