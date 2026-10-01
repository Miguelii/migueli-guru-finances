import { describe, it, expect } from 'vitest'
import { formatTaxRate, getCapitalGainsTax } from '@/lib/portfolio/capital-gains-tax'
import { Ticker, TickerType, TransactionType, type Transaction } from '@/types/Transaction'

const buy = (buy_date: Transaction['buy_date'], type = TransactionType.Buy): Transaction => ({
    id: '1',
    ticker_id: Ticker.VUAA,
    type,
    buy_date,
    fee: 0,
})

const at = (iso: string) => new Date(iso)

describe('getCapitalGainsTax', () => {
    it('should be null for non-BUY transactions and assets without rules', () => {
        expect(
            getCapitalGainsTax(buy('2026-01-01 10:00:00', TransactionType.Sell), TickerType.Etf)
        ).toBeNull()
        expect(getCapitalGainsTax(buy('2026-01-01 10:00:00'), TickerType.Cambio)).toBeNull()
        expect(getCapitalGainsTax(buy('2026-01-01 10:00:00'))).toBeNull()
    })

    it.each([
        ['2026-06-01T10:00:00', 0.28, 0.252],
        ['2028-01-01T10:00:00', 0.252, 0.224],
        ['2031-06-01T10:00:00', 0.224, 0.196],
        ['2034-01-01T10:00:00', 0.196, null],
    ])('should apply the ETF bracket for %s', (now, rate, nextRate) => {
        const tax = getCapitalGainsTax(buy('2026-01-01 10:00:00'), TickerType.Etf, at(now))!

        expect(tax.rate).toBe(rate)
        expect(tax.next?.rate ?? null).toBe(nextRate)
    })

    it('should use the same brackets for stocks', () => {
        const tax = getCapitalGainsTax(
            buy('2020-01-01 10:00:00'),
            TickerType.Stock,
            at('2026-01-01T10:00:00')
        )!

        expect(tax.rate).toBe(0.224)
    })

    it('should date the next bracket from the purchase date', () => {
        const tax = getCapitalGainsTax(
            buy('2026-03-17 10:00:00'),
            TickerType.Etf,
            at('2026-10-01T10:00:00')
        )!

        expect(tax.next?.date).toEqual(at('2028-03-17T10:00:00'))
    })

    it('should build the full timeline with the current step flagged', () => {
        const { timeline } = getCapitalGainsTax(
            buy('2026-01-01 10:00:00'),
            TickerType.Etf,
            at('2029-01-01T10:00:00')
        )!

        expect(timeline.map((step) => step.rate)).toEqual([0.28, 0.252, 0.224, 0.196])
        expect(timeline.map((step) => step.isCurrent)).toEqual([false, true, false, false])
        expect(timeline.at(-1)!.until).toBeNull()
    })

    it('should exempt crypto after one year', () => {
        expect(
            getCapitalGainsTax(
                buy('2025-01-01 10:00:00'),
                TickerType.Crypto,
                at('2026-06-01T10:00:00')
            )!.rate
        ).toBe(0)
        expect(
            getCapitalGainsTax(
                buy('2026-01-01 10:00:00'),
                TickerType.Crypto,
                at('2026-06-01T10:00:00')
            )!.next
        ).toEqual({ rate: 0, date: at('2027-01-01T10:00:00') })
    })
})

describe('formatTaxRate', () => {
    it('should drop trailing zeros', () => {
        expect(formatTaxRate(0.28)).toBe('28%')
        expect(formatTaxRate(0.252)).toBe('25.2%')
        expect(formatTaxRate(0.196)).toBe('19.6%')
        expect(formatTaxRate(0)).toBe('0%')
    })
})
