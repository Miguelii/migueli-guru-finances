import { type Transaction } from '@/types/Transaction'
import { SbTables } from '@/_bff/common/supabase/types'
import { unstable_cache } from 'next/cache'
import type { SbClient } from '@/_bff/common/supabase/types'
import {
    GET_ALL_TRANSACTIONS_CACHE_KEY,
    GET_ALL_TRANSACTIONS_REVALIDATE_TIME,
    getAllTransactionsCacheTag,
} from '@/_bff/modules/transactions/transactions.constants'
import type {
    CreateTransactionProps,
    UpdateTransactionProps,
} from '@/_bff/modules/transactions/transactions.dto'

/**
 * Creates a cached function that fetches all transactions owned by the given user.
 *
 * @param supabaseClient
 * @param userId - Scopes the query (`user_id` filter) and the cache key
 */
export const getAllTransactionsByUserIdFn = (supabaseClient: SbClient, userId: string) =>
    unstable_cache(
        async () => {
            const { data, error } = await supabaseClient
                .from(SbTables.TRANSACTIONS)
                .select('*')
                .eq('user_id', userId)
                .order('buy_date', { ascending: false })

            if (error) throw error

            return data as Transaction[]
        },
        [GET_ALL_TRANSACTIONS_CACHE_KEY, userId],
        {
            revalidate: GET_ALL_TRANSACTIONS_REVALIDATE_TIME,
            tags: [GET_ALL_TRANSACTIONS_CACHE_KEY, getAllTransactionsCacheTag(userId)],
        }
    )

/**
 * Inserts a new transaction owned by the given user.
 *
 * @param supabaseClient
 * @param userId - Owner of the row (RLS WITH CHECK)
 * @param props - Transaction fields to insert
 */
export function insertTransaction(
    supabaseClient: SbClient,
    userId: string,
    props: CreateTransactionProps
) {
    return supabaseClient.from(SbTables.TRANSACTIONS).insert({
        ...props,
        quantity: props.quantity ?? null,
        transaction_price: props.transaction_price ?? null,
        value: props.value ?? null,
        exchange_rate: props.exchange_rate ?? null,
        user_id: userId,
    })
}

/**
 * Updates a transaction by id, scoped to the given user. Optional fields left
 * empty are written as `null` so they can be cleared on edit.
 *
 * @param supabaseClient
 * @param userId - Owner of the row (extra guard on top of RLS)
 * @param props - Transaction id + fields to update
 */
export function updateTransactionById(
    supabaseClient: SbClient,
    userId: string,
    props: UpdateTransactionProps
) {
    const { id, ...fields } = props

    return supabaseClient
        .from(SbTables.TRANSACTIONS)
        .update({
            ...fields,
            quantity: fields.quantity ?? null,
            transaction_price: fields.transaction_price ?? null,
            value: fields.value ?? null,
            exchange_rate: fields.exchange_rate ?? null,
        })
        .eq('id', id)
        .eq('user_id', userId)
}

/**
 * Deletes a transaction by id, scoped to the given user.
 *
 * @param supabaseClient
 * @param userId - Owner of the row (extra guard on top of RLS)
 * @param id - Transaction id to delete
 */
export function deleteTransactionById(supabaseClient: SbClient, userId: string, id: string) {
    return supabaseClient.from(SbTables.TRANSACTIONS).delete().eq('id', id).eq('user_id', userId)
}
