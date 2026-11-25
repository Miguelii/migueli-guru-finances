import { type Cause, Effect, Result } from 'effect'
import { unstable_cache } from 'next/cache'
import { Logger } from '@/_bff/common/logger/logger'
import type { NewsItem } from '@/types/News'
import {
    type NewsAsset,
    buildNewsQueries,
    mergeNews,
} from '@/_bff/modules/news/helpers/news.helper'
import { readNewsAssets } from '@/_bff/modules/news/helpers/read-news-assets.helper'
import { getGoogleNews } from '@/_bff/modules/news/providers/google-news.provider'
import { getYahooNames, getYahooNews } from '@/_bff/modules/news/providers/yahoo-news.provider'
import type { NewsTickersProps } from '@/_bff/modules/news/news.dto'
import {
    GET_ASSET_NAMES_REVALIDATE_TIME,
    GET_ASSET_NEWS_CACHE_KEY,
    GET_ASSET_NEWS_REVALIDATE_TIME,
    NEWS_FETCH_CONCURRENCY,
    NEWS_RETRY_POLICY,
    NEWS_SOURCE_TIMEOUT,
} from '@/_bff/modules/news/news.constants'
import {
    GetGoogleNewsError,
    GetYahooNamesError,
    GetYahooNewsError,
    NewsSourcesUnavailableError,
} from '@/_bff/modules/news/news.errors'

// Yahoo search plus one Google News query per search phrase, all in parallel with
// retries. A failing source is logged and skipped; only when every source fails the
// asset fails, so an outage is never cached as "no news"
const fetchAssetNews = Effect.fn('fetchAssetNews')(function* (
    asset: NewsAsset,
    name: string | undefined
) {
    const sources: Effect.Effect<
        NewsItem[],
        GetYahooNewsError | GetGoogleNewsError | Cause.TimeoutError
    >[] = [
        getYahooNews(asset),
        ...buildNewsQueries(asset, name).map((newsQuery) => getGoogleNews(asset, newsQuery)),
    ]

    const results = yield* Effect.forEach(
        sources,
        (source) =>
            source.pipe(
                Effect.timeout(NEWS_SOURCE_TIMEOUT),
                Effect.retry(NEWS_RETRY_POLICY),
                Effect.result
            ),
        { concurrency: 'unbounded' }
    )

    const failures = results
        .filter((result) => Result.isFailure(result))
        .map((result) => result.failure)

    for (const failure of failures) {
        Logger({
            level: 'warn',
            prefix: 'fetchAssetNews',
            message: `${failure._tag} failed`,
            error: failure,
            metadata: { ticker: asset.ticker },
        })
    }

    if (failures.length === results.length) {
        return yield* new NewsSourcesUnavailableError({ cause: failures })
    }

    return results.filter((result) => Result.isSuccess(result)).flatMap((result) => result.success)
})

const getCachedAssetNews = (asset: NewsAsset, name: string | undefined) =>
    unstable_cache(
        (): Promise<NewsItem[]> => Effect.runPromise(fetchAssetNews(asset, name)),
        [GET_ASSET_NEWS_CACHE_KEY, asset.ticker, asset.news_keywords ?? '', name ?? ''],
        { revalidate: GET_ASSET_NEWS_REVALIDATE_TIME, tags: [GET_ASSET_NEWS_CACHE_KEY] }
    )

const getCachedAssetNames = (assets: NewsAsset[]) =>
    unstable_cache(
        async (): Promise<Record<string, string>> =>
            Object.fromEntries(
                await Effect.runPromise(getYahooNames(assets).pipe(Effect.retry(NEWS_RETRY_POLICY)))
            ),
        [
            'getAssetNames',
            ...assets.map((asset) => asset.ticker).toSorted((a, b) => a.localeCompare(b)),
        ],
        { revalidate: GET_ASSET_NAMES_REVALIDATE_TIME, tags: [GET_ASSET_NEWS_CACHE_KEY] }
    )

// Never fails: a missing source or asset only leaves fewer items in the feed
export const getPortfolioNews = Effect.fn('getPortfolioNews')(function* (
    userId: string,
    { tickers }: NewsTickersProps
) {
    const assets = yield* readNewsAssets(tickers, userId)

    const names = yield* Effect.tryPromise({
        try: () => getCachedAssetNames(assets)(),
        catch: (cause) => new GetYahooNamesError({ cause }),
    }).pipe(
        Effect.catch((error) => {
            // Without names the Google queries fall back to the tickers
            Logger({
                level: 'warn',
                prefix: 'getPortfolioNews',
                message: 'names unavailable',
                error,
            })
            return Effect.succeed<Record<string, string>>({})
        })
    )

    const news = yield* Effect.forEach(
        assets,
        (asset) =>
            Effect.tryPromise({
                try: () => getCachedAssetNews(asset, names[asset.ticker])(),
                catch: (cause) => new NewsSourcesUnavailableError({ cause }),
            }).pipe(
                Effect.catch((error) => {
                    Logger({
                        level: 'error',
                        prefix: 'getPortfolioNews',
                        message: 'every news source failed',
                        error,
                        metadata: { ticker: asset.ticker },
                        userId,
                    })
                    return Effect.succeed<NewsItem[]>([])
                })
            ),
        { concurrency: NEWS_FETCH_CONCURRENCY }
    )

    return mergeNews(news.flat(), new Date())
})
