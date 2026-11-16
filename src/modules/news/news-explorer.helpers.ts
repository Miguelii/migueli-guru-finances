import { ALL_NEWS_ASSETS } from '@/lib/constants/news'
import type { NewsItem, PortfolioEvent } from '@/types/News'
import type { TickerData } from '@/types/Transaction'

export type AssetFilterOption = {
    ticker: string
    logo: TickerData['logo']
    newsCount: number
    eventCount: number
}

const DAY_MS = 86_400_000

/**
 * Filter chips: every followed asset with at least one story or event, most news first
 * (ticker order on ties).
 *
 * @param assets - Assets with an open position.
 * @param news - Feed items.
 * @param events - Calendar events.
 */
export function buildAssetFilterOptions(
    assets: TickerData[],
    news: NewsItem[],
    events: PortfolioEvent[]
): AssetFilterOption[] {
    return assets
        .flatMap((asset) => {
            const option = {
                ticker: asset.ticker,
                logo: asset.logo,
                newsCount: news.filter((item) => item.ticker === asset.ticker).length,
                eventCount: events.filter((event) => event.ticker === asset.ticker).length,
            }

            return option.newsCount > 0 || option.eventCount > 0 ? [option] : []
        })
        .toSorted((a, b) => b.newsCount - a.newsCount || a.ticker.localeCompare(b.ticker))
}

/**
 * Keeps the items of one asset, or every item for the "all" filter.
 *
 * @param items - News items or events.
 * @param asset - Selected ticker or {@link ALL_NEWS_ASSETS}.
 */
export function filterByAsset<T extends { ticker: string }>(items: T[], asset: string): T[] {
    if (asset === ALL_NEWS_ASSETS) return items
    return items.filter((item) => item.ticker === asset)
}

/**
 * Stories published in the last `days` days.
 *
 * @param news - Feed items.
 * @param now - Reference instant.
 * @param days - Window size in days.
 */
export function countRecentNews(news: NewsItem[], now: Date, days: number): number {
    const since = now.getTime() - days * DAY_MS
    return news.filter((item) => new Date(item.publishedAt).getTime() >= since).length
}
