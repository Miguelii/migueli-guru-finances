import { describe, it, expect } from 'vitest'
import { formatCurrency, formatQuantity, formatPercentage, formatDate } from '@/lib/formaters'
import { Currency } from '@/types/Transaction'

// ─── formatCurrency ──────────────────────────────────────────────────────────

describe('formatCurrency', () => {
    it.each([
        ['EUR values', 1234.56, Currency.EUR, ['1', '234', '56', '€']],
        ['USD values', 1000, Currency.USD, ['1', '000', '$']],
        ['values rounded to 2 decimal places by default', 99.999, Currency.EUR, ['100']],
        ['USDC values', 1000, Currency.USDC, ['1', '000', 'USDC']],
    ])('should format %s', (_label, value, currency, expected) => {
        const result = formatCurrency(value, currency)
        for (const part of expected) {
            expect(result).toContain(part)
        }
    })
})

// ─── formatQuantity ──────────────────────────────────────────────────────────

describe('formatQuantity', () => {
    it.each([
        ['integer without trailing decimals', 5, undefined, '5'],
        ['with up to 4 decimal places by default', 1.23456, undefined, '1,2346'],
        ['with custom decimal places', 1.23456, 2, '1,23'],
        ['with pt-PT locale (comma as decimal separator)', 0.5, undefined, '0,5'],
        ['zero', 0, undefined, '0'],
        ['stripping unnecessary trailing zeros', 1.1, undefined, '1,1'],
    ])('should format %s', (_label, value, decimals, expected) => {
        expect(formatQuantity(value, decimals)).toBe(expected)
    })

    it('should format large numbers with thousand separator', () => {
        const result = formatQuantity(10000)
        // jsdom may use narrow no-break space instead of dot as thousand separator
        expect(result.replaceAll(/\s/g, '')).toBe('10000')
    })
})

// ─── formatPercentage ────────────────────────────────────────────────────────

describe('formatPercentage', () => {
    it.each([
        ['positive percentage', 12.345, '12.35%'],
        ['negative percentage', -5.1, '-5.10%'],
        ['zero', 0, '0.00%'],
        ['always showing 2 decimal places', 100, '100.00%'],
        ['rounding to 2 decimal places', 33.339, '33.34%'],
    ])('should format %s', (_label, value, expected) => {
        expect(formatPercentage(value)).toBe(expected)
    })
})

// ─── formatDate ──────────────────────────────────────────────────────────────

describe('formatDate', () => {
    it.each([
        ['date string with space separator', '2026-03-17 10:00:00', ['17', '2026']],
        ['date string with T separator', '2026-03-17T10:00:00', ['17', '2026']],
        ['January date with day and year', '2026-01-15 08:00:00', ['15', '2026']],
        ['December date with day and year', '2026-12-25 00:00:00', ['25', '2026']],
        ['single-digit day padded with leading zero', '2026-06-05 12:00:00', ['05']],
    ])('should format %s', (_label, input, expected) => {
        const result = formatDate(input)
        for (const part of expected) {
            expect(result).toContain(part)
        }
    })
})
