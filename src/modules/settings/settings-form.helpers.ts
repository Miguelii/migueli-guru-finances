import type { UserSettings } from '@/types/UserSettings'
import { parseDecimalInput } from '@/lib/utils'

export type SettingsFormValues = {
    netMonthlySalaryEur: string
    emergencyFundGoalEur: string
}

function toAmountValue(value: number | null): string {
    if (value === null) return ''

    return Number.isInteger(value) ? String(value) : value.toFixed(2).replace('.', ',')
}

export function toSettingsFormValues(
    settings: Pick<UserSettings, 'netMonthlySalaryEur' | 'emergencyFundGoalEur'>
): SettingsFormValues {
    return {
        netMonthlySalaryEur: toAmountValue(settings.netMonthlySalaryEur),
        emergencyFundGoalEur: toAmountValue(settings.emergencyFundGoalEur),
    }
}

/**
 * Converts the form strings into the update payload. Returns `null` when a value is
 * missing or invalid (the goal must be above zero).
 *
 * @param values - Current form values.
 */
export function toSettingsPayload(
    values: SettingsFormValues
): Record<'netMonthlySalaryEur' | 'emergencyFundGoalEur', number> | null {
    const netMonthlySalaryEur = parseDecimalInput(values.netMonthlySalaryEur)
    const emergencyFundGoalEur = parseDecimalInput(values.emergencyFundGoalEur)

    if (netMonthlySalaryEur === null || emergencyFundGoalEur === null) return null
    if (emergencyFundGoalEur <= 0) return null

    return { netMonthlySalaryEur, emergencyFundGoalEur }
}
