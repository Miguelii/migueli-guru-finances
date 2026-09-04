import { describe, expect, it } from 'vitest'
import { calculateTransactionInvested } from '@/modules/transactions/transactions-card.helpers'
import {
    Currency,
    Ticker,
    TickerService,
    TickerType,
    TransactionType,
    type TickerData,
    type Transaction,
} from '@/types/Transaction'

const tickerData: TickerData[] = [
    {
        ticker: Ticker.ETH,
        curr_price: 2000,
        last_updated_at: '2026-01-01 10:00:00',
        service: TickerService.Coinbase,
        currency: Currency.EUR,
        symbol: '€',
        type: TickerType.Crypto,
    },
    {
        ticker: Ticker.ATCH,
        curr_price: 100,
        last_updated_at: '2026-01-01 10:00:00',
        service: TickerService.Yahoo,
        currency: Currency.USD,
        symbol: '$',
        type: TickerType.Stock,
    },
    {
        ticker: Ticker.USD_EUR,
        curr_price: 0.9,
        last_updated_at: '2026-01-01 10:00:00',
        service: TickerService.Yahoo,
        currency: Currency.EUR,
        symbol: '€-$',
        type: TickerType.Cambio,
    },
]

const makeTransaction = (overrides: Partial<Transaction> & { id: string }): Transaction => ({
    ticker_id: Ticker.ETH,
    type: TransactionType.Buy,
    buy_date: '2026-01-01 10:00:00',
    fee: 0,
    ...overrides,
})

describe('calculateTransactionInvested', () => {
    it('tracks chronological invested cost in EUR using FIFO for sells', () => {
        const transactions = [
            makeTransaction({
                id: 'sell',
                type: TransactionType.Sell,
                buy_date: '2026-01-03 10:00:00',
                quantity: 0.5,
                transaction_price: 1200,
            }),
            makeTransaction({
                id: 'usd-buy',
                ticker_id: Ticker.ATCH,
                buy_date: '2026-01-02 10:00:00',
                value: 100,
                quantity: 1,
                exchange_rate: 0.8,
            }),
            makeTransaction({ id: 'buy', value: 1000, quantity: 1 }),
            makeTransaction({
                id: 'fee',
                type: TransactionType.Fee,
                buy_date: '2026-01-04 10:00:00',
                fee: 10,
            }),
        ]

        const result = calculateTransactionInvested(transactions, tickerData)

        expect(result.get('buy')).toBe(1000)
        expect(result.get('usd-buy')).toBe(1080)
        expect(result.get('sell')).toBe(580)
        expect(result.get('fee')).toBe(580)
    })
})
