import { describe, expect, it } from 'vitest'
import type { Payslip } from '@/types/Payslip'
import {
    getCreateValues,
    getFirstMissingMonth,
    isMonthTaken,
    parseYearInput,
    toFormValues,
} from '@/modules/payslips/payslip-drawer/payslip-drawer.helpers'

const payslip = (year: number, month: number, net = 2577.2, meal = 183.6): Payslip => ({
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

describe('parseYearInput', () => {
    it('accepts whole years in range only', () => {
        expect(parseYearInput('2026')).toBe(2026)
        expect(parseYearInput('1999')).toBeNull()
        expect(parseYearInput('2026.5')).toBeNull()
        expect(parseYearInput('')).toBeNull()
    })
})

describe('isMonthTaken', () => {
    const payslips = [payslip(2026, 3)]

    it('flags a month that already has a payslip', () => {
        expect(isMonthTaken(payslips, 2026, 3, null)).toBe(true)
        expect(isMonthTaken(payslips, 2026, 4, null)).toBe(false)
    })

    it('ignores the payslip being edited', () => {
        expect(isMonthTaken(payslips, 2026, 3, '2026-3')).toBe(false)
    })
})

describe('getFirstMissingMonth', () => {
    it('returns the first month without a payslip', () => {
        expect(getFirstMissingMonth([payslip(2026, 1), payslip(2026, 3)], 2026)).toBe(2)
    })

    it('returns null for a complete year', () => {
        const full = Array.from({ length: 12 }, (_, index) => payslip(2026, index + 1))

        expect(getFirstMissingMonth(full, 2026)).toBeNull()
    })
})

describe('getCreateValues', () => {
    it('uses the requested month and copies the amounts of the latest payslip', () => {
        expect(getCreateValues([payslip(2026, 11, 2653.2, 193.8)], 2026, 12)).toEqual({
            year: '2026',
            month: '12',
            net_salary: '2653,20',
            meal_allowance: '193,80',
            note: '',
        })
    })

    it('picks the first missing month and rolls over a complete year', () => {
        const full = Array.from({ length: 12 }, (_, index) => payslip(2026, 12 - index))

        expect(getCreateValues([payslip(2026, 1)], 2026, null).month).toBe('2')
        expect(getCreateValues(full, 2026, null)).toMatchObject({ year: '2027', month: '1' })
    })

    it('starts empty without payslips', () => {
        expect(getCreateValues([], 2026, null)).toMatchObject({
            month: '1',
            net_salary: '',
            meal_allowance: '',
        })
    })
})

describe('toFormValues', () => {
    it('maps a payslip into comma-decimal strings', () => {
        expect(toFormValues({ ...payslip(2026, 3, 3782.2, 204), note: 'Bonus' })).toEqual({
            year: '2026',
            month: '3',
            net_salary: '3782,20',
            meal_allowance: '204,00',
            note: 'Bonus',
        })
    })
})
