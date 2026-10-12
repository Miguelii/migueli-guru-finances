import YahooFinance from 'yahoo-finance2'
import { Effect } from 'effect'
import { NewsProvider, PortfolioEventType, type NewsItem, type PortfolioEvent } from '@/types/News'
import type { TickerData } from '@/types/Transaction'
import {
    type NewsAsset,
    isSafeUrl,
    toYahooNewsSymbol,
} from '@/_bff/modules/news/helpers/news.helper'
import { YAHOO_NEWS_COUNT } from '@/_bff/modules/news/news.constants'
import {
    GetYahooEventsError,
    GetYahooNamesError,
    GetYahooNewsError,
} from '@/_bff/modules/news/news.errors'

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

/**
 * Fetches the latest Yahoo Finance news of an asset (search by its Yahoo symbol).
 * Items with a non-https link are dropped.
 *
 * @param asset - The asset to fetch the news for
 * @returns An Effect resolving to the asset's news, newest first as Yahoo returns them
 */
export function getYahooNews(asset: NewsAsset): Effect.Effect<NewsItem[], GetYahooNewsError> {
    return Effect.tryPromise({
        try: async () => {
            const { news } = await yahooFinance.search(toYahooNewsSymbol(asset), {
                newsCount: YAHOO_NEWS_COUNT,
                quotesCount: 0,
            })

            return news.flatMap((item): NewsItem[] =>
                isSafeUrl(item.link)
                    ? [
                          {
                              id: `${NewsProvider.Yahoo}:${asset.ticker}:${item.uuid}`,
                              ticker: asset.ticker,
                              title: item.title,
                              source: item.publisher,
                              url: item.link,
                              publishedAt: new Date(item.providerPublishTime).toISOString(),
                              provider: NewsProvider.Yahoo,
                              fromKeywords: false,
                          },
                      ]
                    : []
            )
        },
        catch: (cause) =>
            new GetYahooNewsError({ cause, message: 'Failed to fetch news from Yahoo Finance' }),
    })
}

/**
 * Fetches the upcoming corporate events of a stock from Yahoo Finance: the next
 * earnings date (flagged when estimated), the ex-dividend and the dividend payment date.
 * Yahoo has no calendar for ETFs and crypto, so only call it for stocks.
 *
 * @param asset - The stock to fetch the events for
 * @returns An Effect resolving to the stock's events (dates as UTC `YYYY-MM-DD`)
 */
export function getYahooCalendarEvents(
    asset: NewsAsset
): Effect.Effect<PortfolioEvent[], GetYahooEventsError> {
    return Effect.tryPromise({
        try: async () => {
            const { calendarEvents } = await yahooFinance.quoteSummary(toYahooNewsSymbol(asset), {
                modules: ['calendarEvents'],
            })

            const dates: [PortfolioEventType, Date | undefined, boolean][] = [
                [
                    PortfolioEventType.Earnings,
                    calendarEvents?.earnings?.earningsDate?.[0],
                    calendarEvents?.earnings?.isEarningsDateEstimate ?? false,
                ],
                [PortfolioEventType.ExDividend, calendarEvents?.exDividendDate, false],
                [PortfolioEventType.DividendPayment, calendarEvents?.dividendDate, false],
            ]

            return dates.flatMap(([type, date, isEstimate]): PortfolioEvent[] => {
                if (!date || Number.isNaN(new Date(date).getTime())) return []

                const day = new Date(date).toISOString().slice(0, 10)

                return [
                    {
                        id: `${asset.ticker}:${type}:${day}`,
                        ticker: asset.ticker,
                        type,
                        date: day,
                        isEstimate,
                    },
                ]
            })
        },
        catch: (cause) =>
            new GetYahooEventsError({
                cause,
                message: 'Failed to fetch calendar events from Yahoo Finance',
            }),
    })
}

/**
 * Fetches the company/asset names of several assets with a single Yahoo quote request
 * (`longName`, falling back to `shortName`). Symbols Yahoo does not know are omitted.
 *
 * @param assets - The assets to name
 * @returns An Effect resolving to a map of ticker to name
 */
export function getYahooNames(
    assets: NewsAsset[]
): Effect.Effect<Map<TickerData['ticker'], string>, GetYahooNamesError> {
    return Effect.tryPromise({
        try: async () => {
            if (assets.length === 0) return new Map<TickerData['ticker'], string>()

            const quotes = await yahooFinance.quote(
                assets.map((asset) => toYahooNewsSymbol(asset)),
                {
                    return: 'object',
                    fields: ['longName', 'shortName'],
                }
            )

            return new Map(
                assets.flatMap((asset) => {
                    const quote = quotes[toYahooNewsSymbol(asset)]
                    const name = quote?.longName ?? quote?.shortName

                    return name ? [[asset.ticker, name] as const] : []
                })
            )
        },
        catch: (cause) =>
            new GetYahooNamesError({ cause, message: 'Failed to fetch names from Yahoo Finance' }),
    })
}
