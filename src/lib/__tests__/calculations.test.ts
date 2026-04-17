import { describe, it, expect } from 'vitest'
import { aggregateHoldings, computePortfolioTotals } from '@/lib/calculations'
import type { Transaction, TickerData } from '@/types/Transaction'
import { TransactionType, Ticker, Currency } from '@/types/Transaction'

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
        expect(aggregateHoldings([], [ethTd])).toEqual([])
    })

    it('should return one holding per ticker', () => {
        const txs: Transaction[] = [
            makeTx({ id: '1', ticker_id: Ticker.ETH, value: 1000, quantity: 0.5 }),
            makeTx({ id: '2', ticker_id: Ticker.SOL, value: 500, quantity: 5 }),
        ]
        const result = aggregateHoldings(txs, [ethTd, solTd])

        expect(result).toHaveLength(2)
        expect(result.map((h) => h.ticker_id)).toContain(Ticker.ETH)
        expect(result.map((h) => h.ticker_id)).toContain(Ticker.SOL)
    })

    it('should map ticker metadata (logo, hex_color, currency)', () => {
        const txs = [makeTx({ id: '1', ticker_id: Ticker.ETH, value: 100, quantity: 0.05 })]
        const [h] = aggregateHoldings(txs, [ethTd])

        expect(h.tickerLogo).toBe('/assets/ethereum.webp')
        expect(h.tickerHexColor).toBe('#627EEA')
        expect(h.currency).toBe('EUR')
        expect(h.symbol).toBe(Ticker.ETH)
    })

    it('should fall back to EUR when ticker data is missing', () => {
        const txs = [makeTx({ id: '1', ticker_id: Ticker.BTC, value: 5000, quantity: 0.1 })]
        const [h] = aggregateHoldings(txs, [])

        expect(h.currency).toBe('EUR')
        expect(h.current_price).toBe(0)
        expect(h.current_value).toBe(0)
    })
})

// ─── BUY transactions (cost basis) ──────────────────────────────────────────

describe('aggregateHoldings — BUY', () => {
    it('should compute basic metrics for a single BUY', () => {
        const txs = [makeTx({ id: '1', ticker_id: Ticker.ETH, value: 1000, quantity: 0.5, fee: 5 })]
        const [h] = aggregateHoldings(txs, [ethTd])

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
        const [h] = aggregateHoldings(txs, [ethTd])

        expect(h.total_quantity).toBeCloseTo(1.5)
        expect(h.total_invested).toBeCloseTo(4000)
        expect(h.total_fees).toBeCloseTo(15)
        expect(h.avg_cost_per_share).toBeCloseTo(4000 / 1.5, 2) // ~2666.67
    })

    it('should handle BUY with zero quantity', () => {
        const txs = [makeTx({ id: '1', ticker_id: Ticker.ETH, value: 0, quantity: 0, fee: 0 })]
        const [h] = aggregateHoldings(txs, [ethTd])

        expect(h.total_quantity).toBe(0)
        expect(h.avg_cost_per_share).toBe(0)
    })

    it('should handle BUY with undefined quantity/value', () => {
        const txs = [makeTx({ id: '1', ticker_id: Ticker.ETH, fee: 2 })]
        const [h] = aggregateHoldings(txs, [ethTd])

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
        const [h] = aggregateHoldings(txs, [ethTd])

        expect(h.total_quantity).toBeCloseTo(0.6)
        expect(h.total_invested).toBeCloseTo(1000)
    })

    it('should lower avg cost per share when reward tokens are added', () => {
        const txs: Transaction[] = [
            makeTx({ id: '1', ticker_id: Ticker.ETH, value: 1000, quantity: 0.5 }),
            makeTx({ id: '2', ticker_id: Ticker.ETH, type: TransactionType.Reward, quantity: 0.5 }),
        ]
        const [h] = aggregateHoldings(txs, [ethTd])

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
        const [h] = aggregateHoldings(txs, [ethTd])

        expect(h.total_fees).toBe(17)
    })

    it('should affect unrealized G/L with fees', () => {
        const txs = [
            makeTx({ id: '1', ticker_id: Ticker.ETH, value: 1000, quantity: 0.5, fee: 50 }),
        ]
        const [h] = aggregateHoldings(txs, [ethTd])

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
        const [h] = aggregateHoldings(txs, [ethTd])

        // avgCost = 2000, costOfSold = 2000 * 0.5 = 1000
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
        const [h] = aggregateHoldings(txs, [ethTd])

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
        const [h] = aggregateHoldings(txs, [ethTd])

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
        const [h] = aggregateHoldings(txs, [ethTd])

        // avgCost = 2000, each sell cost = 2000 * 0.5 = 1000
        // sell1 realized = 1500 - 1000 = 500
        // sell2 realized = 2500 - 1000 = 1500
        expect(h.realized_gl).toBeCloseTo(2000)
        expect(h.total_quantity).toBeCloseTo(1)
        expect(h.total_invested).toBeCloseTo(2000)
    })
})

// ─── Unrealized G/L ─────────────────────────────────────────────────────────

describe('aggregateHoldings — unrealized G/L', () => {
    it('should compute unrealized gain when price is above avg cost', () => {
        // Buy at 1000/unit, current price 2000
        const txs = [makeTx({ id: '1', ticker_id: Ticker.ETH, value: 1000, quantity: 1 })]
        const [h] = aggregateHoldings(txs, [ethTd])

        // current_value = 1 * 2000 = 2000, unrealized = 2000 - 1000 = 1000
        expect(h.unrealized_gl).toBeCloseTo(1000)
        expect(h.unrealized_gl_pct).toBeCloseTo(100)
    })

    it('should compute unrealized loss when price is below avg cost', () => {
        const lowTd = makeTd({ ticker: Ticker.ETH, curr_price: 500 })
        const txs = [makeTx({ id: '1', ticker_id: Ticker.ETH, value: 1000, quantity: 1 })]
        const [h] = aggregateHoldings(txs, [lowTd])

        // current_value = 1 * 500 = 500, unrealized = 500 - 1000 = -500
        expect(h.unrealized_gl).toBeCloseTo(-500)
        expect(h.unrealized_gl_pct).toBeCloseTo(-50)
    })

    it('should be zero when current price equals avg cost', () => {
        const flatTd = makeTd({ ticker: Ticker.ETH, curr_price: 1000 })
        const txs = [makeTx({ id: '1', ticker_id: Ticker.ETH, value: 1000, quantity: 1 })]
        const [h] = aggregateHoldings(txs, [flatTd])

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
        const [h] = aggregateHoldings(txs, [ethTd])

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
        const [h] = aggregateHoldings(txs, [ethTd])

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
        const [h] = aggregateHoldings(txs, [ethTd])

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
        const result = aggregateHoldings(txs, [ethTd, solTd])

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
        const result = aggregateHoldings(txs, [ethTd, solTd])

        const eth = result.find((h) => h.ticker_id === Ticker.ETH)!
        const sol = result.find((h) => h.ticker_id === Ticker.SOL)!

        expect(eth.total_fees).toBe(10)
        expect(sol.total_fees).toBe(3)
    })
})

// ─── computePortfolioTotals ──────────────────────────────────────────────────

describe('computePortfolioTotals', () => {
    const rates = { usdToEur: 0.85, usdcToEur: 1 } // Mock rates

    it('should compute totals for holdings with no sells', () => {
        const holdings = [
            {
                ticker_id: Ticker.ETH,
                total_invested: 1000,
                current_value: 2000,
                realized_gl: 0,
                currency: Currency.EUR,
            } as any,
        ]
        const result = computePortfolioTotals(holdings, rates)

        expect(result.totalInvested).toBe(1000)
        expect(result.currentValue).toBe(2000)
        expect(result.glValue).toBe(1000)
        expect(result.glPct).toBe(100)
        expect(result.totalRealize).toBe(0)
    })

    it('should compute totals including realized gains', () => {
        const holdings = [
            {
                ticker_id: Ticker.ETH,
                total_invested: 500, // After selling half
                current_value: 1000,
                realized_gl: 500, // Profit from selling half
                currency: Currency.EUR,
            } as any,
        ]
        const result = computePortfolioTotals(holdings, rates)

        expect(result.totalInvested).toBe(500)
        expect(result.currentValue).toBe(1000)
        expect(result.glValue).toBe(1000) // 1000 - 500 + 500
        expect(result.glPct).toBe(200)
        expect(result.totalRealize).toBe(500)
    })

    it('should handle sold everything scenario', () => {
        const holdings = [
            {
                ticker_id: Ticker.ETH,
                total_invested: 0, // Sold everything
                current_value: 0,
                realized_gl: 500, // Profit from selling
                currency: Currency.EUR,
            } as any,
        ]
        const result = computePortfolioTotals(holdings, rates)

        expect(result.totalInvested).toBe(0)
        expect(result.currentValue).toBe(0)
        expect(result.glValue).toBe(500) // 0 - 0 + 500
        expect(result.glPct).toBe(0) // Since totalInvested is 0
        expect(result.totalRealize).toBe(500)
    })

    it('should handle multiple currencies with conversion', () => {
        const holdings = [
            {
                ticker_id: Ticker.ETH,
                total_invested: 1000,
                current_value: 2000,
                realized_gl: 0,
                currency: Currency.USD,
            } as any,
        ]
        const result = computePortfolioTotals(holdings, rates)

        expect(result.totalInvested).toBeCloseTo(850) // 1000 * 0.85
        expect(result.currentValue).toBeCloseTo(1700) // 2000 * 0.85
        expect(result.glValue).toBeCloseTo(850) // 1700 - 850 + 0
        expect(result.glPct).toBe(100)
        expect(result.totalRealize).toBe(0)
    })
})
