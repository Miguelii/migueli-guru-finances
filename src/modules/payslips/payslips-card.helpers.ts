import type { Payslip } from '@/types/Payslip'
import { MONTHS_PER_YEAR } from '@/modules/payslips/payslips-card.constants'

export type PayslipAmounts = Pick<Payslip, 'net_salary' | 'meal_allowance'>

export type PayslipMonthRow = {
    month: number
    payslip: Payslip | null
}

export type PayslipYearTotals = {
    netSalary: number
    mealAllowance: number
    total: number
    monthlyAverage: number
    count: number
}

export function getPayslipTotal(payslip: PayslipAmounts): number {
    return payslip.net_salary + payslip.meal_allowance
}

/**
 * Years that can be picked in the year filter, newest first. Always includes `currentYear`
 * so the current year can be filled in before its first payslip exists.
 *
 * @param payslips - Every payslip of the user.
 * @param currentYear - Calendar year of today.
 */
export function getPayslipYears(payslips: Payslip[], currentYear: number): number[] {
    const years = new Set([currentYear, ...payslips.map((payslip) => payslip.year)])

    return [...years].toSorted((a, b) => b - a)
}

/**
 * Year shown in the table: the one in the URL when it is a valid option, otherwise the
 * newest year with payslips.
 *
 * @param requested - Year read from the URL (`null` when absent).
 * @param years - Options from `getPayslipYears` (newest first, never empty).
 */
export function resolveSelectedYear(requested: number | null, years: number[]): number {
    if (requested !== null && years.includes(requested)) return requested

    return years[0] ?? new Date().getFullYear()
}

/**
 * One row per calendar month of `year` (January first), with the payslip of that month or
 * `null` when it was not added yet.
 *
 * @param payslips - Every payslip of the user.
 * @param year - Year to lay out.
 */
export function getYearRows(payslips: Payslip[], year: number): PayslipMonthRow[] {
    const byMonth = new Map(
        payslips.flatMap((payslip) =>
            payslip.year === year ? [[payslip.month, payslip] as const] : []
        )
    )

    return Array.from({ length: MONTHS_PER_YEAR }, (_, index) => ({
        month: index + 1,
        payslip: byMonth.get(index + 1) ?? null,
    }))
}

export function getYearTotals(rows: PayslipMonthRow[]): PayslipYearTotals {
    const payslips = rows.flatMap((row) => (row.payslip ? [row.payslip] : []))
    const netSalary = payslips.reduce((sum, payslip) => sum + payslip.net_salary, 0)
    const mealAllowance = payslips.reduce((sum, payslip) => sum + payslip.meal_allowance, 0)
    const total = netSalary + mealAllowance

    return {
        netSalary,
        mealAllowance,
        total,
        monthlyAverage: payslips.length > 0 ? total / payslips.length : 0,
        count: payslips.length,
    }
}

/**
 * Month name in the pt-PT locale with an uppercase first letter (e.g. `Março`).
 *
 * @param month - Calendar month (1 = January).
 */
export function formatMonthName(month: number): string {
    const name = new Date(2000, month - 1, 1).toLocaleDateString('pt-PT', { month: 'long' })

    return name.charAt(0).toUpperCase() + name.slice(1)
}
