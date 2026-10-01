import { describe, it, expect } from 'vitest'
import {
    aggregateMonthlyPurchasesEur,
    getTransactionFeeEur,
    getTransactionValueEur,
    summarizeTransactions,
} from '@/lib/portfolio/transactions-summary'
import {
    Currency,
    Ticker,
    TickerService,
    TickerType,
    TransactionType,
    type CambioRates,
    type TickerData,
    type Transaction,
} from '@/types/Transaction'

const rates: CambioRates = { usdToEur: 0.9, usdcToEur: 0.9 }

const makeTd = (ticker: Ticker, currency: Currency): TickerData => ({
    ticker,
    curr_price: 0,
    last_updated_at: '2026-03-17 10:00:00',
    service: TickerService.Coinbase,
    currency,
    symbol: '€',
    type: TickerType.Crypto,
})

const makeTx = (overrides: Partial<Transaction> & { id: string }): Transaction => ({
    ticker_id: Ticker.ETH,
    type: TransactionType.Buy,
    buy_date: '2026-01-15 10:00:00',
    fee: 0,
    ...overrides,
})

const tickerData = [makeTd(Ticker.ETH, Currency.EUR), makeTd(Ticker.ATCH, Currency.USD)]
const currencyMap = new Map(tickerData.map((td) => [td.ticker, td.currency]))

describe('getTransactionValueEur / getTransactionFeeEur', () => {
    it('should keep EUR values and convert others at the historical rate', () => {
        expect(getTransactionValueEur(makeTx({ id: '1', value: 100 }), Currency.EUR, rates)).toBe(
            100
        )
        expect(
            getTransactionValueEur(
                makeTx({ id: '2', value: 100, exchange_rate: 0.8 }),
                Currency.USD,
                rates
            )
        ).toBeCloseTo(80)
    })

    it('should fall back to the current rate without an exchange rate', () => {
        expect(getTransactionFeeEur(makeTx({ id: '3', fee: 10 }), Currency.USD, rates)).toBeCloseTo(
            9
        )
    })
})

describe('summarizeTransactions', () => {
    it('should total buys, sells and fees in EUR and count rewards', () => {
        const summary = summarizeTransactions(
            [
                makeTx({ id: '1', value: 100, fee: 1 }),
                makeTx({ id: '2', type: TransactionType.Sell, value: 50, fee: 0.5 }),
                makeTx({
                    id: '3',
                    ticker_id: Ticker.ATCH,
                    value: 100,
                    fee: 2,
                    exchange_rate: 0.8,
                }),
                makeTx({ id: '4', type: TransactionType.Reward, quantity: 0.01 }),
                makeTx({ id: '5', type: TransactionType.Fee, fee: 3 }),
            ],
            currencyMap,
            rates
        )

        expect(summary.boughtEur).toBeCloseTo(180)
        expect(summary.soldEur).toBeCloseTo(50)
        expect(summary.feesEur).toBeCloseTo(1 + 0.5 + 1.6 + 3)
        expect(summary.rewardsCount).toBe(1)
        expect(summary.count).toBe(5)
    })

    it('should be zero for an empty list', () => {
        expect(summarizeTransactions([], currencyMap, rates)).toEqual({
            boughtEur: 0,
            soldEur: 0,
            feesEur: 0,
            rewardsCount: 0,
            count: 0,
        })
    })
})

describe('aggregateMonthlyPurchasesEur', () => {
    const txs = [
        makeTx({ id: '1', value: 100, buy_date: '2026-01-15 10:00:00' }),
        makeTx({ id: '2', value: 50, buy_date: '2026-01-20 10:00:00' }),
        makeTx({
            id: '3',
            ticker_id: Ticker.ATCH,
            value: 100,
            exchange_rate: 0.8,
            buy_date: '2026-03-05 10:00:00',
        }),
        makeTx({
            id: '4',
            type: TransactionType.Sell,
            value: 999,
            buy_date: '2026-03-06 10:00:00',
        }),
        makeTx({ id: '5', value: 999, buy_date: '2025-12-31 10:00:00' }),
    ]

    it('should bucket BUY values per month and asset in EUR for the year only', () => {
        const result = aggregateMonthlyPurchasesEur(txs, tickerData, rates, 2026)

        expect(result.months).toHaveLength(12)
        expect(result.months[0]![Ticker.ETH]).toBeCloseTo(150)
        expect(result.months[2]![Ticker.ATCH]).toBeCloseTo(80)
        expect(result.months[1]![Ticker.ETH]).toBeUndefined()
        expect(result.totalEur).toBeCloseTo(230)
        expect(result.avgEur).toBeCloseTo(230 / 12)
    })

    it('should sort assets by total and compute their share', () => {
        const { assets } = aggregateMonthlyPurchasesEur(txs, tickerData, rates, 2026)

        expect(assets.map((asset) => asset.ticker)).toEqual([Ticker.ETH, Ticker.ATCH])
        expect(assets[0]!.share).toBeCloseTo((150 / 230) * 100)
        expect(assets[1]!.avgEur).toBeCloseTo(80 / 12)
    })

    it('should report the best month, or null without purchases', () => {
        expect(aggregateMonthlyPurchasesEur(txs, tickerData, rates, 2026).bestMonth).toEqual({
            month: 0,
            totalEur: 150,
        })
        expect(aggregateMonthlyPurchasesEur(txs, tickerData, rates, 2024).bestMonth).toBeNull()
    })
})
