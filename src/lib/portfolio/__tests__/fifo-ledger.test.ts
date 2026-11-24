import { describe, expect, it } from 'vitest'
import { buildFifoLedger } from '@/lib/portfolio/fifo-ledger'
import { Currency } from '@/types/core/Currency'
import { Ticker } from '@/types/core/Ticker'
import { TickerService } from '@/types/core/TickerService'
import { TickerType } from '@/types/core/TickerType'
import {
    TransactionType,
    type CambioRates,
    type TickerData,
    type Transaction,
} from '@/types/Transaction'

const rates: CambioRates = { usdToEur: 0.85, usdcToEur: 0.9 }

const makeTd = (ticker: Ticker, type: TickerType, currency = Currency.EUR): TickerData => ({
    ticker,
    curr_price: 0,
    last_updated_at: '2026-11-01 10:00:00',
    service: TickerService.Coinbase,
    currency,
    symbol: '€',
    type,
})

const makeTx = (
    overrides: Partial<Transaction> & Pick<Transaction, 'id' | 'buy_date'>
): Transaction => ({
    ticker_id: Ticker.ETH,
    type: TransactionType.Buy,
    fee: 0,
    ...overrides,
})

const tickerData = [makeTd(Ticker.ETH, TickerType.Crypto), makeTd(Ticker.VUAA, TickerType.Etf)]

describe('buildFifoLedger', () => {
    it('links a sale to the first buy and keeps the rest of the lot open', () => {
        const transactions = [
            makeTx({
                id: 'sell',
                type: TransactionType.Sell,
                buy_date: '2026-10-30 00:02:00',
                quantity: 1,
                value: 2008.62,
                fee: 10.04,
            }),
            makeTx({
                id: 'buy',
                buy_date: '2025-02-06 00:00:00',
                quantity: 1.0012,
                value: 1657.58,
            }),
        ]

        const { sells, lots } = buildFifoLedger(transactions, tickerData, rates)
        const sell = sells.get('sell')!
        const lot = lots.get('buy')!

        expect(sell.lots).toHaveLength(1)
        expect(sell.lots[0]).toMatchObject({ lotId: 'buy', quantity: 1, taxRate: 0 })
        expect(sell.costEur).toBeCloseTo(1657.58 / 1.0012, 6)
        expect(sell.gainEur).toBeCloseTo(2008.62 - 10.04 - 1657.58 / 1.0012, 6)
        expect(sell.taxRates).toEqual([0])
        expect(sell.unmatchedQuantity).toBe(0)

        expect(lot.soldQuantity).toBe(1)
        expect(lot.remainingQuantity).toBeCloseTo(0.0012, 10)
        expect(lot.isClosed).toBe(false)
        expect(lot.sales).toEqual([
            expect.objectContaining({ sellId: 'sell', soldAt: '2026-10-30 00:02:00', taxRate: 0 }),
        ])
    })

    it('spreads a sale over several lots, oldest first, each with its own tax rate', () => {
        const transactions = [
            makeTx({ id: 'old', buy_date: '2025-01-10 10:00:00', quantity: 1, value: 1000 }),
            makeTx({ id: 'new', buy_date: '2026-06-10 10:00:00', quantity: 2, value: 3000 }),
            makeTx({
                id: 'sell',
                type: TransactionType.Sell,
                buy_date: '2026-09-01 10:00:00',
                quantity: 2,
                value: 4000,
            }),
        ]

        const { sells, lots } = buildFifoLedger(transactions, tickerData, rates)
        const sell = sells.get('sell')!

        expect(sell.lots.map((lot) => [lot.lotId, lot.quantity, lot.taxRate])).toEqual([
            ['old', 1, 0],
            ['new', 1, 0.28],
        ])
        expect(sell.lots[0]!.gainEur).toBeCloseTo(1000, 6)
        expect(sell.lots[1]!.gainEur).toBeCloseTo(500, 6)
        expect(sell.taxRates).toEqual([0.28, 0])
        expect(lots.get('old')).toMatchObject({ isClosed: true, remainingQuantity: 0 })
        expect(lots.get('new')).toMatchObject({ isClosed: false, remainingQuantity: 1 })
    })

    it('treats rewards as zero-cost lots', () => {
        const transactions = [
            makeTx({
                id: 'reward',
                type: TransactionType.Reward,
                buy_date: '2026-01-01 10:00:00',
                quantity: 0.5,
            }),
            makeTx({
                id: 'sell',
                type: TransactionType.Sell,
                buy_date: '2026-02-01 10:00:00',
                quantity: 0.5,
                value: 1000,
            }),
        ]

        const sell = buildFifoLedger(transactions, tickerData, rates).sells.get('sell')!

        expect(sell.lots[0]).toMatchObject({
            lotId: 'reward',
            lotType: TransactionType.Reward,
            costEur: 0,
            gainEur: 1000,
        })
    })

    it('reports the quantity sold without an earlier lot', () => {
        const transactions = [
            makeTx({ id: 'buy', buy_date: '2026-01-01 10:00:00', quantity: 1, value: 100 }),
            makeTx({
                id: 'sell',
                type: TransactionType.Sell,
                buy_date: '2026-02-01 10:00:00',
                quantity: 1.5,
                value: 300,
            }),
        ]

        const sell = buildFifoLedger(transactions, tickerData, rates).sells.get('sell')!

        expect(sell.lots).toHaveLength(1)
        expect(sell.unmatchedQuantity).toBeCloseTo(0.5, 10)
    })

    it('keeps tickers apart and uses the ETF brackets', () => {
        const transactions = [
            makeTx({ id: 'eth', buy_date: '2020-01-01 10:00:00', quantity: 1, value: 100 }),
            makeTx({
                id: 'vuaa',
                ticker_id: Ticker.VUAA,
                buy_date: '2020-01-01 10:00:00',
                quantity: 1,
                value: 100,
            }),
            makeTx({
                id: 'sell',
                ticker_id: Ticker.VUAA,
                type: TransactionType.Sell,
                buy_date: '2026-01-01 10:00:00',
                quantity: 1,
                value: 150,
            }),
        ]

        const { sells, lots } = buildFifoLedger(transactions, tickerData, rates)

        expect(sells.get('sell')!.lots[0]).toMatchObject({ lotId: 'vuaa', taxRate: 0.224 })
        expect(lots.has('eth')).toBe(false)
    })

    it('converts USD lots at their historical rate', () => {
        const transactions = [
            makeTx({
                id: 'buy',
                ticker_id: Ticker.VUAA,
                buy_date: '2026-01-01 10:00:00',
                quantity: 1,
                value: 100,
                exchange_rate: 0.9,
            }),
            makeTx({
                id: 'sell',
                ticker_id: Ticker.VUAA,
                type: TransactionType.Sell,
                buy_date: '2026-03-01 10:00:00',
                quantity: 1,
                value: 120,
                exchange_rate: 0.8,
            }),
        ]

        const sell = buildFifoLedger(
            transactions,
            [makeTd(Ticker.VUAA, TickerType.Etf, Currency.USD)],
            rates
        ).sells.get('sell')!

        expect(sell.costEur).toBeCloseTo(90, 6)
        expect(sell.gainEur).toBeCloseTo(120 * 0.8 - 90, 6)
    })
})
