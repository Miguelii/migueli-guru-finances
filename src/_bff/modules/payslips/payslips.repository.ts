import type { Payslip } from '@/types/Payslip'
import { DBTables, type SbClient } from '@/_bff/common/db/types'
import { unstable_cache } from 'next/cache'
import {
    GET_PAYSLIPS_CACHE_KEY,
    GET_PAYSLIPS_REVALIDATE_TIME,
    getPayslipsCacheTag,
} from '@/_bff/modules/payslips/payslips.constants'
import type { CreatePayslipProps, UpdatePayslipProps } from '@/_bff/modules/payslips/payslips.dto'

export const getPayslipsByUserIdFn = (supabaseClient: SbClient, userId: string) =>
    unstable_cache(
        async () => {
            const { data, error } = await supabaseClient
                .from(DBTables.PAYSLIPS)
                .select('*')
                .eq('user_id', userId)
                .order('year', { ascending: false })
                .order('month', { ascending: false })

            if (error) throw error

            // SAFETY: the select returns all payslip columns defined by the database schema.
            return data as Payslip[]
        },
        [GET_PAYSLIPS_CACHE_KEY, userId],
        {
            revalidate: GET_PAYSLIPS_REVALIDATE_TIME,
            tags: [GET_PAYSLIPS_CACHE_KEY, getPayslipsCacheTag(userId)],
        }
    )

export function insertPayslip(supabaseClient: SbClient, userId: string, props: CreatePayslipProps) {
    return supabaseClient.from(DBTables.PAYSLIPS).insert({
        ...props,
        note: props.note || null,
        user_id: userId,
    })
}

export function updatePayslipById(
    supabaseClient: SbClient,
    userId: string,
    props: UpdatePayslipProps
) {
    const { id, ...fields } = props

    return supabaseClient
        .from(DBTables.PAYSLIPS)
        .update({ ...fields, note: fields.note || null, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)
}

export function deletePayslipById(supabaseClient: SbClient, userId: string, id: string) {
    return supabaseClient.from(DBTables.PAYSLIPS).delete().eq('id', id).eq('user_id', userId)
}
