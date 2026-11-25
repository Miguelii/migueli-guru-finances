import { Effect } from 'effect'
import { unstable_cache } from 'next/cache'
import { Logger } from '@/_bff/common/logger/logger'
import type { PortfolioEvent } from '@/types/News'
import { TickerType } from '@/types/core/TickerType'
import type { NewsAsset } from '@/_bff/modules/news/helpers/news.helper'
import { readNewsAssets } from '@/_bff/modules/news/helpers/read-news-assets.helper'
import { getYahooCalendarEvents } from '@/_bff/modules/news/providers/yahoo-news.provider'
import type { NewsTickersProps } from '@/_bff/modules/news/news.dto'
import {
    GET_ASSET_EVENTS_CACHE_KEY,
    GET_ASSET_EVENTS_REVALIDATE_TIME,
    NEWS_FETCH_CONCURRENCY,
    NEWS_RETRY_POLICY,
    NEWS_SOURCE_TIMEOUT,
} from '@/_bff/modules/news/news.constants'
import { GetYahooEventsError } from '@/_bff/modules/news/news.errors'

// A failure throws out of the cache function, so it is never cached as "no events"
const getCachedAssetEvents = (asset: NewsAsset) =>
    unstable_cache(
        (): Promise<PortfolioEvent[]> =>
            Effect.runPromise(
                getYahooCalendarEvents(asset).pipe(
                    Effect.timeout(NEWS_SOURCE_TIMEOUT),
                    Effect.retry(NEWS_RETRY_POLICY)
                )
            ),
        [GET_ASSET_EVENTS_CACHE_KEY, asset.ticker],
        { revalidate: GET_ASSET_EVENTS_REVALIDATE_TIME, tags: [GET_ASSET_EVENTS_CACHE_KEY] }
    )

// Never fails: an asset whose calendar cannot be read is logged and left out.
// Yahoo only has calendars for stocks, so ETFs and crypto are not requested
export const getPortfolioEvents = Effect.fn('getPortfolioEvents')(function* (
    userId: string,
    { tickers }: NewsTickersProps
) {
    const assets = yield* readNewsAssets(tickers, userId)
    const stocks = assets.filter((asset) => asset.type === TickerType.Stock)

    const events = yield* Effect.forEach(
        stocks,
        (asset) =>
            Effect.tryPromise({
                try: () => getCachedAssetEvents(asset)(),
                catch: (cause) => new GetYahooEventsError({ cause }),
            }).pipe(
                Effect.catch((error) => {
                    Logger({
                        level: 'warn',
                        prefix: 'getPortfolioEvents',
                        message: `${error._tag} failed`,
                        error,
                        metadata: { ticker: asset.ticker },
                        userId,
                    })
                    return Effect.succeed<PortfolioEvent[]>([])
                })
            ),
        { concurrency: NEWS_FETCH_CONCURRENCY }
    )

    return events.flat().toSorted((a, b) => a.date.localeCompare(b.date))
})
