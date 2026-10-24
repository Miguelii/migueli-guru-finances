import { describe, it, expect } from 'vitest'
import {
    type PriceHistory,
    addDaysToDateKey,
    buildHistoricalSnapshots,
    computeSnapshotTotals,
    toDateKey,
} from '@/lib/portfolio/portfolio-snapshots'
import type { Transaction, TickerData } from '@/types/Transaction'
import { TransactionType } from '@/types/Transaction'
import { Ticker } from '@/types/core/Ticker'
import { Currency } from '@/types/core/Currency'
import { TickerService } from '@/types/core/TickerService'
import { TickerType } from '@/types/core/TickerType'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeTd = (overrides: Partial<TickerData> & { ticker: Ticker }): TickerData => ({
    curr_price: 0,
    last_updated_at: '2026-03-17 10:00:00',
    service: TickerService.Coinbase,
    currency: Currency.EUR,
    symbol: '€',
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

const history = (entries: Record<string, Record<string, number>>): PriceHistory =>
    new Map(
        Object.entries(entries).map(([ticker, closes]) => [
            ticker as Ticker,
            new Map(Object.entries(closes)),
        ])
    )

const ethTd = makeTd({ ticker: Ticker.ETH, curr_price: 2000 })
const usdRateTd = makeTd({
    ticker: Ticker.USD_EUR,
    service: TickerService.Yahoo,
    type: TickerType.Cambio,
    curr_price: 0.9,
})
const vuaaTd = makeTd({
    ticker: Ticker.VUAA,
    service: TickerService.Yahoo,
    currency: Currency.USD,
    type: TickerType.Etf,
    curr_price: 120,
})

// ─── Day keys ────────────────────────────────────────────────────────────────

describe('toDateKey', () => {
    it('should use the calendar day of the given time zone', () => {
        const lateUtc = new Date('2026-07-01T23:30:00Z')

        expect(toDateKey(lateUtc, 'UTC')).toBe('2026-07-01')
        expect(toDateKey(lateUtc, 'Europe/Lisbon')).toBe('2026-07-02')
    })
})

describe('addDaysToDateKey', () => {
    it('should cross month and year boundaries in both directions', () => {
        expect(addDaysToDateKey('2026-01-31', 1)).toBe('2026-02-01')
        expect(addDaysToDateKey('2026-01-01', -1)).toBe('2025-12-31')
        expect(addDaysToDateKey('2024-02-28', 1)).toBe('2024-02-29')
    })
})

// ─── computeSnapshotTotals ───────────────────────────────────────────────────

describe('computeSnapshotTotals', () => {
    it('should value the holdings at current prices and keep realized gains', () => {
        const txs = [
            makeTx({ id: '1', ticker_id: Ticker.ETH, quantity: 2, value: 2000 }),
            makeTx({
                id: '2',
                ticker_id: Ticker.ETH,
                type: TransactionType.Sell,
                quantity: 1,
                value: 1500,
                buy_date: '2026-02-01 10:00:00',
            }),
        ]

        expect(computeSnapshotTotals(txs, [ethTd])).toEqual({
            valueEur: 2000,
            investedEur: 1000,
            realizedGlEur: 500,
        })
    })
})

// ─── buildHistoricalSnapshots ────────────────────────────────────────────────

describe('buildHistoricalSnapshots', () => {
    it('should return an empty array for no transactions', () => {
        expect(buildHistoricalSnapshots([], [ethTd], new Map(), '2026-01-05')).toEqual([])
    })

    it('should build one point per day from the first transaction, carrying closes forward', () => {
        const txs = [
            makeTx({
                id: '1',
                ticker_id: Ticker.ETH,
                quantity: 1,
                value: 1000,
                buy_date: '2026-01-02 18:00:00',
            }),
            makeTx({
                id: '2',
                ticker_id: Ticker.ETH,
                quantity: 1,
                value: 1200,
                buy_date: '2026-01-04 09:00:00',
            }),
        ]
        const prices = history({ ETH: { '2026-01-02': 1100, '2026-01-04': 1300 } })

        const result = buildHistoricalSnapshots(txs, [ethTd], prices, '2026-01-05')

        expect(result.map((p) => p.date)).toEqual([
            '2026-01-02',
            '2026-01-03',
            '2026-01-04',
            '2026-01-05',
        ])
        expect(result.map((p) => p.valueEur)).toEqual([1100, 1100, 2600, 2600])
        expect(result.map((p) => p.investedEur)).toEqual([1000, 1000, 2200, 2200])
    })

    it('should fall back to the last trade price before the history starts', () => {
        const txs = [
            makeTx({
                id: '1',
                ticker_id: Ticker.ETH,
                quantity: 2,
                transaction_price: 900,
                buy_date: '2026-01-01 10:00:00',
            }),
        ]
        const prices = history({ ETH: { '2026-01-03': 1000 } })

        const result = buildHistoricalSnapshots(txs, [ethTd], prices, '2026-01-03')

        expect(result.map((p) => p.valueEur)).toEqual([1800, 1800, 2000])
    })

    it('should convert the value at each day rate and the cost at the transaction rate', () => {
        const txs = [
            makeTx({
                id: '1',
                ticker_id: Ticker.VUAA,
                quantity: 10,
                value: 1000,
                exchange_rate: 0.95,
                buy_date: '2026-01-01 10:00:00',
            }),
        ]
        const prices = history({
            [Ticker.VUAA]: { '2026-01-01': 100, '2026-01-02': 110 },
            [Ticker.USD_EUR]: { '2026-01-01': 0.95, '2026-01-02': 0.8 },
        })

        const result = buildHistoricalSnapshots(txs, [vuaaTd, usdRateTd], prices, '2026-01-02')

        expect(result.map((p) => p.valueEur)).toEqual([950, 880])
        expect(result.map((p) => p.investedEur)).toEqual([950, 950])
    })

    it('should drop sold positions from the value and keep their realized gain', () => {
        const txs = [
            makeTx({ id: '1', ticker_id: Ticker.ETH, quantity: 1, value: 1000 }),
            makeTx({
                id: '2',
                ticker_id: Ticker.ETH,
                type: TransactionType.Sell,
                quantity: 1,
                value: 1400,
                buy_date: '2026-01-02 10:00:00',
            }),
        ]
        const prices = history({ ETH: { '2026-01-01': 1100, '2026-01-02': 1400 } })

        const [first, second] = buildHistoricalSnapshots(txs, [ethTd], prices, '2026-01-02')

        expect(first).toMatchObject({ valueEur: 1100, investedEur: 1000, realizedGlEur: 0 })
        expect(second).toMatchObject({ valueEur: 0, investedEur: 0, realizedGlEur: 400 })
    })
})
