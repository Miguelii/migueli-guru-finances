import { describe, expect, it } from 'vitest'
import type { Payslip } from '@/types/Payslip'
import {
    formatMonthName,
    getPayslipYears,
    getYearRows,
    getYearTotals,
    resolveSelectedYear,
} from '@/modules/payslips/payslips-card.helpers'

const payslip = (year: number, month: number, net: number, meal: number): Payslip => ({
    id: `${year}-${month}`,
    user_id: 'user',
    year,
    month,
    net_salary: net,
    meal_allowance: meal,
    note: null,
    created_at: '',
    updated_at: '',
})

const PAYSLIPS = [
    payslip(2026, 3, 3782.2, 204),
    payslip(2026, 1, 2532.28, 193.8),
    payslip(2024, 12, 2000, 150),
]

describe('getPayslipYears', () => {
    it('lists the years with payslips plus the current year, newest first', () => {
        expect(getPayslipYears(PAYSLIPS, 2027)).toEqual([2027, 2026, 2024])
    })

    it('does not duplicate the current year', () => {
        expect(getPayslipYears(PAYSLIPS, 2026)).toEqual([2026, 2024])
    })
})

describe('resolveSelectedYear', () => {
    it('keeps a requested year that is an option', () => {
        expect(resolveSelectedYear(2024, [2026, 2024])).toBe(2024)
    })

    it('falls back to the newest year when the request is missing or unknown', () => {
        expect(resolveSelectedYear(null, [2026, 2024])).toBe(2026)
        expect(resolveSelectedYear(1999, [2026, 2024])).toBe(2026)
    })
})

describe('getYearRows', () => {
    it('lays out the twelve months in order, with null for the missing ones', () => {
        const rows = getYearRows(PAYSLIPS, 2026)

        expect(rows).toHaveLength(12)
        expect(rows.map((row) => row.month)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
        expect(rows[0]?.payslip?.net_salary).toBe(2532.28)
        expect(rows[1]?.payslip).toBeNull()
        expect(rows[2]?.payslip?.net_salary).toBe(3782.2)
    })
})

describe('getYearTotals', () => {
    it('sums the year and averages over the months with a payslip', () => {
        const totals = getYearTotals(getYearRows(PAYSLIPS, 2026))

        expect(totals.count).toBe(2)
        expect(totals.netSalary).toBeCloseTo(6314.48)
        expect(totals.mealAllowance).toBeCloseTo(397.8)
        expect(totals.total).toBeCloseTo(6712.28)
        expect(totals.monthlyAverage).toBeCloseTo(3356.14)
    })

    it('returns zeros for an empty year', () => {
        expect(getYearTotals(getYearRows(PAYSLIPS, 2030))).toEqual({
            netSalary: 0,
            mealAllowance: 0,
            total: 0,
            monthlyAverage: 0,
            count: 0,
        })
    })
})

describe('formatMonthName', () => {
    it('capitalizes the pt-PT month name', () => {
        expect(formatMonthName(3)).toBe('Março')
    })
})
