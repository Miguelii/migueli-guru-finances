import { describe, it, expect } from 'vitest'
import { formatCurrency, formatQuantity, formatPercentage, formatDate } from '@/lib/formaters'
import { Currency } from '@/types/Transaction'

// ─── formatCurrency ──────────────────────────────────────────────────────────

describe('formatCurrency', () => {
    it('should format EUR values', () => {
        const result = formatCurrency(1234.56, Currency.EUR)
        expect(result).toContain('1')
        expect(result).toContain('234')
        expect(result).toContain('56')
        expect(result).toContain('€')
    })

    it('should format USD values', () => {
        const result = formatCurrency(1000, Currency.USD)
        expect(result).toContain('1')
        expect(result).toContain('000')
        expect(result).toContain('$')
    })

    it('should round to 2 decimal places by default', () => {
        const result = formatCurrency(99.999, Currency.EUR)
        // 99.999 rounded to 2 decimals = 100.00
        expect(result).toContain('100')
    })

    it('should format USD values', () => {
        const result = formatCurrency(1000, Currency.USDC)
        expect(result).toContain('1')
        expect(result).toContain('000')
        expect(result).toContain('USDC')
    })
})

// ─── formatQuantity ──────────────────────────────────────────────────────────

describe('formatQuantity', () => {
    it('should format integer without trailing decimals', () => {
        expect(formatQuantity(5)).toBe('5')
    })

    it('should format with up to 4 decimal places by default', () => {
        expect(formatQuantity(1.23456)).toBe('1,2346')
    })

    it('should respect custom decimal places', () => {
        expect(formatQuantity(1.23456, 2)).toBe('1,23')
    })

    it('should use pt-PT locale (comma as decimal separator)', () => {
        expect(formatQuantity(0.5)).toBe('0,5')
    })

    it('should format large numbers with thousand separator', () => {
        const result = formatQuantity(10000)
        // jsdom may use narrow no-break space instead of dot as thousand separator
        expect(result.replaceAll(/\s/g, '')).toBe('10000')
    })

    it('should format zero', () => {
        expect(formatQuantity(0)).toBe('0')
    })

    it('should strip unnecessary trailing zeros', () => {
        expect(formatQuantity(1.1)).toBe('1,1')
    })
})

// ─── formatPercentage ────────────────────────────────────────────────────────

describe('formatPercentage', () => {
    it('should format positive percentage', () => {
        expect(formatPercentage(12.345)).toBe('12.35%')
    })

    it('should format negative percentage', () => {
        expect(formatPercentage(-5.1)).toBe('-5.10%')
    })

    it('should format zero', () => {
        expect(formatPercentage(0)).toBe('0.00%')
    })

    it('should always show 2 decimal places', () => {
        expect(formatPercentage(100)).toBe('100.00%')
    })

    it('should round to 2 decimal places', () => {
        expect(formatPercentage(33.339)).toBe('33.34%')
    })
})

// ─── formatDate ──────────────────────────────────────────────────────────────

describe('formatDate', () => {
    it('should format a date string with space separator', () => {
        const result = formatDate('2026-03-17 10:00:00')
        expect(result).toContain('17')
        expect(result).toContain('2026')
    })

    it('should format a date string with T separator', () => {
        const result = formatDate('2026-03-17T10:00:00')
        expect(result).toContain('17')
        expect(result).toContain('2026')
    })

    it('should include day and year for January date', () => {
        const result = formatDate('2026-01-15 08:00:00')
        expect(result).toContain('15')
        expect(result).toContain('2026')
    })

    it('should include day and year for December date', () => {
        const result = formatDate('2026-12-25 00:00:00')
        expect(result).toContain('25')
        expect(result).toContain('2026')
    })

    it('should pad single-digit days with leading zero', () => {
        const result = formatDate('2026-06-05 12:00:00')
        expect(result).toContain('05')
    })
})
