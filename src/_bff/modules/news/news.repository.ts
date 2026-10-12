import { unstable_cache } from 'next/cache'
import { DBTables } from '@/_bff/common/db/types'
import type { SbClient } from '@/_bff/common/db/types'
import {
    GET_ASSETS_CACHE_KEY,
    GET_DATA_REVALIDATE_TIME,
} from '@/_bff/modules/assets/assets.constants'
import type { NewsAsset } from '@/_bff/modules/news/helpers/news.helper'
import { NEWS_ASSET_COLUMNS } from '@/_bff/modules/news/news.constants'

/**
 * Creates a cached function that fetches the news-related columns of some assets.
 * Tagged with the assets tag, so editing an asset's search terms refreshes it.
 *
 * @param supabaseClient
 * @param tickers - Assets to read (part of the cache key)
 */
export const getNewsAssetsFn = (supabaseClient: SbClient, tickers: string[]) =>
    unstable_cache(
        async () => {
            const { data, error } = await supabaseClient
                .from(DBTables.DATA)
                .select(NEWS_ASSET_COLUMNS)
                .in('ticker', tickers)
                .overrideTypes<NewsAsset[]>()

            if (error) throw error

            return data ?? []
        },
        ['getNewsAssets', ...tickers.toSorted()],
        {
            revalidate: GET_DATA_REVALIDATE_TIME,
            tags: [GET_ASSETS_CACHE_KEY],
        }
    )
