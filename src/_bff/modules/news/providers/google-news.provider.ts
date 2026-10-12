import { XMLParser } from 'fast-xml-parser'
import { Effect } from 'effect'
import { NewsProvider, type NewsItem } from '@/types/News'
import { type NewsAsset, type NewsQuery, isSafeUrl } from '@/_bff/modules/news/helpers/news.helper'
import { GOOGLE_NEWS_RSS_URL } from '@/_bff/modules/news/news.constants'
import { GetGoogleNewsError } from '@/_bff/modules/news/news.errors'

type RssItem = {
    title?: unknown
    link?: unknown
    guid?: unknown
    pubDate?: unknown
    source?: unknown
}

// Tag values stay strings (a numeric headline must not become a number)
const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false })

/**
 * Reads the text of an RSS node that may carry attributes (`<source url="…">Name</source>`).
 *
 * @param node - Parsed XML node
 */
function readText(node: unknown): string {
    if (typeof node === 'string') return node.trim()
    if (node && typeof node === 'object' && '#text' in node) return String(node['#text']).trim()
    return ''
}

/**
 * Parses a Google News RSS document into news items of an asset. Google appends
 * " - <source>" to every title, which is stripped. Items without a title, a valid
 * date or an https link are dropped.
 *
 * @param xml - RSS document
 * @param ticker - Asset the items belong to
 * @param fromKeywords - Whether the query was the asset's own search terms
 */
export function parseGoogleNewsRss(
    xml: string,
    ticker: NewsAsset['ticker'],
    fromKeywords: boolean
): NewsItem[] {
    const document = parser.parse(xml) as { rss?: { channel?: { item?: RssItem | RssItem[] } } }
    const rawItems = document.rss?.channel?.item
    const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : []

    return items.flatMap((item): NewsItem[] => {
        const source = readText(item.source)
        const rawTitle = readText(item.title)
        const title =
            source && rawTitle.endsWith(` - ${source}`)
                ? rawTitle.slice(0, -` - ${source}`.length)
                : rawTitle
        const url = readText(item.link)
        const published = new Date(readText(item.pubDate))

        if (!title || !isSafeUrl(url) || Number.isNaN(published.getTime())) return []

        return [
            {
                id: `${NewsProvider.Google}:${ticker}:${readText(item.guid) || url}`,
                ticker,
                title,
                source: source || 'Google News',
                url,
                publishedAt: published.toISOString(),
                provider: NewsProvider.Google,
                fromKeywords,
            },
        ]
    })
}

/**
 * Searches Google News (public RSS, personal non-commercial use) for one query.
 *
 * @param asset - The asset the results belong to
 * @param newsQuery - Search query (e.g. '"AtlasClear"' or 'AtlasClear lawsuit') and
 *   whether it comes from the asset's own search terms
 * @returns An Effect resolving to the matching news
 */
export function getGoogleNews(
    asset: NewsAsset,
    { query, fromKeywords }: NewsQuery
): Effect.Effect<NewsItem[], GetGoogleNewsError> {
    return Effect.tryPromise({
        try: async () => {
            const params = new URLSearchParams({ q: query, hl: 'en-US', gl: 'US', ceid: 'US:en' })
            const res = await fetch(`${GOOGLE_NEWS_RSS_URL}?${params}`, { method: 'GET' })

            if (!res.ok) throw new Error(`Fetch Failed status=${res.status}`)

            return parseGoogleNewsRss(await res.text(), asset.ticker, fromKeywords)
        },
        catch: (cause) =>
            new GetGoogleNewsError({ cause, message: 'Failed to fetch news from Google News' }),
    })
}
