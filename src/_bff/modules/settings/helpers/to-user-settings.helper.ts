import type { UserSettings } from '@/types/UserSettings'
import { storedExpensesSchema } from '@/_bff/modules/settings/settings.dto'
import type { UserSettingsRow } from '@/_bff/modules/settings/settings.repository'

function toNumberOrNull(value: number | string | null): number | null {
    return value === null ? null : Number(value)
}

/**
 * Maps the stored row into the app settings: values stay `null` until the user saves them
 * on the Settings page. PostgREST may return `numeric` columns as strings, hence `Number()`.
 *
 * @param row - The user's `user_settings` row, `null` when there is none.
 */
export function toUserSettings(row: UserSettingsRow | null): UserSettings {
    return {
        netMonthlySalaryEur: row ? toNumberOrNull(row.net_monthly_salary_eur) : null,
        emergencyFundGoalEur: row ? toNumberOrNull(row.emergency_fund_goal_eur) : null,
        monthlyExpenses: row ? storedExpensesSchema.parse(row.monthly_expenses) : [],
    }
}
