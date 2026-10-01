import { describe, expect, it } from 'vitest'
import {
    calculateTransactionInvested,
    filterTransactions,
    formatTimeUntil,
    getTaxBadge,
    groupTransactionsByMonth,
} from '@/modules/transactions/transactions-card/transactions-card.helpers'
import { getCapitalGainsTax } from '@/lib/portfolio/capital-gains-tax'
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

const tx = (overrides: Partial<Transaction> & { id: string }): Transaction => ({
    ticker_id: Ticker.ETH,
    type: TransactionType.Buy,
    buy_date: '2026-09-10 10:00:00',
    fee: 0,
    ...overrides,
})

describe('filterTransactions', () => {
    const txs = [
        tx({ id: '1' }),
        tx({ id: '2', type: TransactionType.Sell }),
        tx({ id: '3', ticker_id: Ticker.SOL }),
    ]

    it('should keep everything with both filters on "all"', () => {
        expect(filterTransactions(txs, 'all', 'all')).toHaveLength(3)
    })

    it('should combine the asset and type filters', () => {
        expect(filterTransactions(txs, Ticker.ETH, TransactionType.Buy).map((t) => t.id)).toEqual([
            '1',
        ])
        expect(filterTransactions(txs, 'all', TransactionType.Sell).map((t) => t.id)).toEqual(['2'])
    })
})

describe('groupTransactionsByMonth', () => {
    it('should group by month keeping the input order', () => {
        const groups = groupTransactionsByMonth([
            tx({ id: '1', buy_date: '2026-09-20 10:00:00' }),
            tx({ id: '2', buy_date: '2026-09-02 10:00:00' }),
            tx({ id: '3', buy_date: '2026-08-15 10:00:00' }),
        ])

        expect(groups.map((g) => g.key)).toEqual(['2026-09', '2026-08'])
        expect(groups[0]!.transactions.map((t) => t.id)).toEqual(['1', '2'])
        expect(groups[0]!.label).toContain('2026')
    })

    it('should return no groups for an empty list', () => {
        expect(groupTransactionsByMonth([])).toEqual([])
    })
})

describe('getTaxBadge', () => {
    const now = new Date('2026-10-01T12:00:00')
    const badgeFor = (
        buyDate: Transaction['buy_date'],
        type: TickerType,
        txType = TransactionType.Buy
    ) =>
        getTaxBadge(
            getCapitalGainsTax(tx({ id: '1', buy_date: buyDate, type: txType }), type, now),
            now
        )

    it('should be null when no rule applies', () => {
        expect(badgeFor('2026-09-10 10:00:00', TickerType.Cambio)).toBeNull()
        expect(badgeFor('2026-09-10 10:00:00', TickerType.Crypto, TransactionType.Sell)).toBeNull()
    })

    it('should flag crypto held for over a year as tax-free', () => {
        expect(badgeFor('2025-01-01 10:00:00', TickerType.Crypto)).toEqual({
            label: 'Tax-free',
            isFinal: true,
        })
    })

    it('should say how long until the crypto exemption', () => {
        expect(badgeFor('2025-12-05 12:00:00', TickerType.Crypto)).toEqual({
            label: 'Tax-free in 2 months, 4 days',
            isFinal: false,
        })
    })

    it('should show the current and next ETF/stock rate', () => {
        expect(badgeFor('2026-03-17 12:00:00', TickerType.Etf)).toEqual({
            label: '28% · 25.2% in 1 year, 5 months',
            isFinal: false,
        })
        expect(badgeFor('2023-03-17 12:00:00', TickerType.Stock)?.label).toBe(
            '25.2% · 22.4% in 1 year, 5 months'
        )
    })

    it('should show only the rate once the last bracket is reached', () => {
        expect(badgeFor('2018-01-01 10:00:00', TickerType.Etf)).toEqual({
            label: '19.6%',
            isFinal: true,
        })
    })
})

describe('formatTimeUntil', () => {
    const now = new Date('2026-10-01T12:00:00')

    it('should format singular and plural parts', () => {
        expect(formatTimeUntil(new Date('2026-11-01T12:00:00'), now)).toBe('1 month')
        expect(formatTimeUntil(new Date('2026-10-13T12:00:00'), now)).toBe('12 days')
        expect(formatTimeUntil(new Date('2026-10-02T12:00:00'), now)).toBe('1 day')
    })

    it('should show years and months (no days) for spans over a year', () => {
        expect(formatTimeUntil(new Date('2028-03-17T12:00:00'), now)).toBe('1 year, 5 months')
        expect(formatTimeUntil(new Date('2029-10-01T12:00:00'), now)).toBe('3 years')
    })
})
