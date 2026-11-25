import { MONTHS_PER_YEAR } from '@/modules/payslips/payslips-card.constants'
import { formatMonthName } from '@/modules/payslips/payslips-card.helpers'

export const NOTE_MAX_LENGTH = 60

export const MIN_PAYSLIP_YEAR = 2000

export const MAX_PAYSLIP_YEAR = 2100

export const MONTH_ITEMS = Array.from({ length: MONTHS_PER_YEAR }, (_, index) => ({
    value: String(index + 1),
    label: formatMonthName(index + 1),
}))
