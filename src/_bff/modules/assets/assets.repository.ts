import { DBTables } from '@/_bff/common/db/types'
import { type TickerData } from '@/types/Transaction'
import { unstable_cache } from 'next/cache'
import type { SbClient } from '@/_bff/common/db/types'
import {
    GET_ASSETS_CACHE_KEY,
    GET_DATA_REVALIDATE_TIME,
} from '@/_bff/modules/assets/assets.constants'
import type { CreateAssetProps } from '@/_bff/modules/assets/assets.dto'

/**
 * Creates a cached function that fetches all ticker data from the database.
 *
 * @param supabaseClient
 * @param userId - For cache key
 */
export const getAssetsFn = (supabaseClient: SbClient, userId: string) =>
    unstable_cache(
        async () => {
            const { data, error } = await supabaseClient
                .from(DBTables.DATA)
                .select('*')
                .order('ticker')

            if (error) throw error

            return data as TickerData[]
        },
        [GET_ASSETS_CACHE_KEY, userId],
        {
            revalidate: GET_DATA_REVALIDATE_TIME,
            tags: [GET_ASSETS_CACHE_KEY],
        }
    )

/**
 * Fetches all ticker rows from the database (uncached).
 *
 * @param supabaseClient
 */
export function selectAllTickers(supabaseClient: SbClient) {
    return supabaseClient.from(DBTables.DATA).select('*')
}

/**
 * Inserts a new asset row into the `data` table.
 *
 * @param supabaseClient
 * @param props - Asset fields plus initial price/logo/timestamp
 */
export function insertAsset(
    supabaseClient: SbClient,
    props: Omit<CreateAssetProps, 'image'> & {
        logo: string | null
        curr_price: number
        last_updated_at: string
    }
) {
    return supabaseClient.from(DBTables.DATA).insert(props)
}

/**
 * Updates an asset row in the `data` table, keyed by ticker. The logo is only
 * touched when a new path is provided.
 *
 * @param supabaseClient
 * @param props - Asset fields plus optional new logo path
 */
export function updateAssetByTicker(
    supabaseClient: SbClient,
    props: Omit<CreateAssetProps, 'image'> & { logo?: string }
) {
    const { ticker, ...fields } = props

    return supabaseClient.from(DBTables.DATA).update(fields).eq('ticker', ticker)
}

/**
 * Deletes an asset row from the `data` table, keyed by ticker.
 *
 * @param supabaseClient
 * @param ticker - The ticker symbol to delete
 */
export function deleteAssetByTicker(supabaseClient: SbClient, ticker: string) {
    return supabaseClient.from(DBTables.DATA).delete().eq('ticker', ticker)
}

/**
 * Updates a single ticker's current price and last-updated timestamp.
 *
 * @param supabaseClient
 * @param ticker - The ticker symbol to update
 * @param price - The new current price
 */
export function updateAssetPrice(
    supabaseClient: SbClient,
    ticker: TickerData['ticker'],
    price: number
) {
    return supabaseClient
        .from(DBTables.DATA)
        .update({ curr_price: price, last_updated_at: 'now()' })
        .eq('ticker', ticker)
}
