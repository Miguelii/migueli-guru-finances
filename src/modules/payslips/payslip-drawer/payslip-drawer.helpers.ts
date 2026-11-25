import type { Payslip } from '@/types/Payslip'
import {
    MAX_PAYSLIP_YEAR,
    MIN_PAYSLIP_YEAR,
} from '@/modules/payslips/payslip-drawer/payslip-drawer.constants'
import { MONTHS_PER_YEAR } from '@/modules/payslips/payslips-card.constants'

export type PayslipFormValues = {
    year: string
    month: string
    net_salary: string
    meal_allowance: string
    note: string
}

/**
 * Parses the year input, returning `null` unless it is a whole year in the accepted range.
 *
 * @param value - Raw input value.
 */
export function parseYearInput(value: string): number | null {
    const parsed = Number(value)

    return Number.isInteger(parsed) && parsed >= MIN_PAYSLIP_YEAR && parsed <= MAX_PAYSLIP_YEAR
        ? parsed
        : null
}

/**
 * Whether another payslip already covers `year` / `month` (the table allows one per month).
 *
 * @param payslips - Every payslip of the user.
 * @param editingId - Id of the payslip being edited, ignored in the check.
 */
export function isMonthTaken(
    payslips: Payslip[],
    year: number,
    month: number,
    editingId: string | null
): boolean {
    return payslips.some(
        (payslip) => payslip.year === year && payslip.month === month && payslip.id !== editingId
    )
}

/**
 * First month of `year` without a payslip, or `null` when the year is complete.
 *
 * @param payslips - Every payslip of the user.
 * @param year - Year to look into.
 */
export function getFirstMissingMonth(payslips: Payslip[], year: number): number | null {
    const taken = new Set(payslips.flatMap((p) => (p.year === year ? [p.month] : [])))

    for (let month = 1; month <= MONTHS_PER_YEAR; month++) {
        if (!taken.has(month)) return month
    }

    return null
}

function toAmountValue(value: number): string {
    return value.toFixed(2).replace('.', ',')
}

export function toFormValues(payslip: Payslip): PayslipFormValues {
    return {
        year: String(payslip.year),
        month: String(payslip.month),
        net_salary: toAmountValue(payslip.net_salary),
        meal_allowance: toAmountValue(payslip.meal_allowance),
        note: payslip.note ?? '',
    }
}

/**
 * Initial values for a new payslip: the requested month (or the first missing month of
 * `year`, rolling over to January of the next year when it is complete) with the amounts
 * of the most recent payslip, since they rarely change from month to month.
 *
 * @param payslips - Every payslip of the user, newest first.
 * @param year - Year selected in the table.
 * @param month - Month picked from an empty row, `null` when opened from the Add button.
 */
export function getCreateValues(
    payslips: Payslip[],
    year: number,
    month: number | null
): PayslipFormValues {
    const missingMonth = month ?? getFirstMissingMonth(payslips, year)
    const latest = payslips[0]

    return {
        year: String(missingMonth === null ? year + 1 : year),
        month: String(missingMonth ?? 1),
        net_salary: latest ? toAmountValue(latest.net_salary) : '',
        meal_allowance: latest ? toAmountValue(latest.meal_allowance) : '',
        note: '',
    }
}

export function getSubmitLabel(isEdit: boolean): string {
    return isEdit ? 'Save changes' : 'Add payslip'
}
