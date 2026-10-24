import { describe, it, expect } from 'vitest'
import { computeAnnualizedReturn } from '@/lib/portfolio/annualized-return'
import type { CambioRates, Transaction, TickerData } from '@/types/Transaction'
import { TransactionType } from '@/types/Transaction'
import { Ticker } from '@/types/core/Ticker'
import { Currency } from '@/types/core/Currency'
import { TickerService } from '@/types/core/TickerService'
import { TickerType } from '@/types/core/TickerType'

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
    buy_date: '2025-01-01 00:00:00',
    fee: 0,
    ...overrides,
})

const ethTd = makeTd({ ticker: Ticker.ETH })
const vuaaTd = makeTd({ ticker: Ticker.VUAA, currency: Currency.USD, type: TickerType.Etf })

// ─── computeAnnualizedReturn ─────────────────────────────────────────────────

describe('computeAnnualizedReturn', () => {
    const now = new Date(2026, 0, 1)

    it('should return null without transactions', () => {
        expect(computeAnnualizedReturn([], [ethTd], rates, 0, undefined, now)).toBeNull()
    })

    it('should return null when the history is too short to annualize', () => {
        const txs = [
            makeTx({
                id: '1',
                ticker_id: Ticker.ETH,
                value: 1000,
                buy_date: '2025-12-01 00:00:00',
            }),
        ]

        expect(computeAnnualizedReturn(txs, [ethTd], rates, 1100, undefined, now)).toBeNull()
    })

    it('should return null when there is no money put in', () => {
        const txs = [makeTx({ id: '1', ticker_id: Ticker.ETH, type: TransactionType.Reward })]

        expect(computeAnnualizedReturn(txs, [ethTd], rates, 500, undefined, now)).toBeNull()
    })

    it('should return 10% for a single buy worth 10% more one year later', () => {
        const txs = [makeTx({ id: '1', ticker_id: Ticker.ETH, value: 1000 })]
        const result = computeAnnualizedReturn(txs, [ethTd], rates, 1100, undefined, now)

        expect(result?.rate).toBeCloseTo(0.1, 6)
        expect(result?.since).toBe('2025-01-01')
    })

    it('should return a negative rate for a loss', () => {
        const txs = [makeTx({ id: '1', ticker_id: Ticker.ETH, value: 1000 })]

        expect(computeAnnualizedReturn(txs, [ethTd], rates, 800, undefined, now)?.rate).toBeCloseTo(
            -0.2,
            6
        )
    })

    it('should weight each buy by how long it has been invested', () => {
        const rate = 0.2
        // 182 days after the first buy, 183 days before `now` (give or take the DST hour)
        const final = 1000 * (1 + rate) + 1000 * (1 + rate) ** (183 / 365)
        const txs = [
            makeTx({ id: '1', ticker_id: Ticker.ETH, value: 1000 }),
            makeTx({
                id: '2',
                ticker_id: Ticker.ETH,
                value: 1000,
                buy_date: '2025-07-02 00:00:00',
            }),
        ]

        expect(
            computeAnnualizedReturn(txs, [ethTd], rates, final, undefined, now)?.rate
        ).toBeCloseTo(rate, 4)
    })

    it('should count fees as money put in', () => {
        const txs = [makeTx({ id: '1', ticker_id: Ticker.ETH, value: 1000, fee: 10 })]

        expect(
            computeAnnualizedReturn(txs, [ethTd], rates, 1111, undefined, now)?.rate
        ).toBeCloseTo(0.1, 6)
    })

    it('should count sells as money taken out', () => {
        const txs = [
            makeTx({ id: '1', ticker_id: Ticker.ETH, value: 1000 }),
            makeTx({
                id: '2',
                ticker_id: Ticker.ETH,
                type: TransactionType.Sell,
                value: 600,
                buy_date: '2026-01-01 00:00:00',
            }),
        ]

        expect(computeAnnualizedReturn(txs, [ethTd], rates, 500, undefined, now)?.rate).toBeCloseTo(
            0.1,
            6
        )
    })

    it('should convert to EUR at the transaction exchange rate', () => {
        const txs = [makeTx({ id: '1', ticker_id: Ticker.VUAA, value: 1000, exchange_rate: 0.9 })]

        expect(
            computeAnnualizedReturn(txs, [vuaaTd], rates, 990, undefined, now)?.rate
        ).toBeCloseTo(0.1, 6)
    })

    it('should start the period the day after the opening snapshot', () => {
        const txs = [
            // Before the opening snapshot, already part of its value
            makeTx({ id: '1', ticker_id: Ticker.ETH, value: 400, buy_date: '2024-06-01 00:00:00' }),
        ]
        const opening = { date: '2024-12-31', valueEur: 1000 }
        const result = computeAnnualizedReturn(txs, [ethTd], rates, 1100, opening, now)

        expect(result?.rate).toBeCloseTo(0.1, 6)
        expect(result?.since).toBe('2025-01-01')
    })

    it('should add the transactions after the opening snapshot', () => {
        const txs = [
            makeTx({
                id: '1',
                ticker_id: Ticker.ETH,
                type: TransactionType.Sell,
                value: 600,
                buy_date: '2026-01-01 00:00:00',
            }),
        ]
        const opening = { date: '2024-12-31', valueEur: 1000 }

        expect(computeAnnualizedReturn(txs, [ethTd], rates, 500, opening, now)?.rate).toBeCloseTo(
            0.1,
            6
        )
    })
})
