import { DBTables, type SbClient } from '@/_bff/common/db/types'
import { unstable_cache } from 'next/cache'
import {
    GET_USER_SETTINGS_CACHE_KEY,
    GET_USER_SETTINGS_REVALIDATE_TIME,
    getUserSettingsCacheTag,
} from '@/_bff/modules/settings/settings.constants'
import type { Expense } from '@/types/Expense'
import type { UpdateSettingsProps } from '@/_bff/modules/settings/settings.dto'

export type UserSettingsRow = {
    user_id: string
    // `numeric` columns: PostgREST may serialize them as strings
    net_monthly_salary_eur: number | string | null
    emergency_fund_goal_eur: number | string | null
    // Untrusted JSON, parsed item by item in `toUserSettings`
    monthly_expenses: unknown
    updated_at: string
}

export const getUserSettingsByUserIdFn = (supabaseClient: SbClient, userId: string) =>
    unstable_cache(
        async () => {
            const { data, error } = await supabaseClient
                .from(DBTables.USER_SETTINGS)
                .select('*')
                .eq('user_id', userId)
                .maybeSingle()

            if (error) throw error

            // SAFETY: the select returns all user_settings columns defined by the database schema.
            return data as UserSettingsRow | null
        },
        [GET_USER_SETTINGS_CACHE_KEY, userId],
        {
            revalidate: GET_USER_SETTINGS_REVALIDATE_TIME,
            tags: [GET_USER_SETTINGS_CACHE_KEY, getUserSettingsCacheTag(userId)],
        }
    )

export function upsertUserSettings(
    supabaseClient: SbClient,
    userId: string,
    props: UpdateSettingsProps
) {
    return supabaseClient.from(DBTables.USER_SETTINGS).upsert({
        user_id: userId,
        net_monthly_salary_eur: props.netMonthlySalaryEur,
        emergency_fund_goal_eur: props.emergencyFundGoalEur,
        updated_at: new Date().toISOString(),
    })
}

// Not cached: expense mutations read, change and write back the latest list
export function selectUserExpenses(supabaseClient: SbClient, userId: string) {
    return supabaseClient
        .from(DBTables.USER_SETTINGS)
        .select('monthly_expenses')
        .eq('user_id', userId)
        .maybeSingle()
}

export function upsertUserExpenses(supabaseClient: SbClient, userId: string, expenses: Expense[]) {
    return supabaseClient.from(DBTables.USER_SETTINGS).upsert({
        user_id: userId,
        monthly_expenses: expenses,
        updated_at: new Date().toISOString(),
    })
}
