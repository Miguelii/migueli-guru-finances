import { XMLParser } from 'fast-xml-parser'
import { Effect, Predicate } from 'effect'
import { z } from 'zod'
import { NewsProvider, type NewsItem } from '@/types/News'
import { type NewsAsset, type NewsQuery, isSafeUrl } from '@/_bff/modules/news/helpers/news.helper'
import { GOOGLE_NEWS_RSS_URL } from '@/_bff/modules/news/news.constants'
import { GetGoogleNewsError } from '@/_bff/modules/news/news.errors'

const xmlTextSchema = z.union([
    z.string(),
    z.object({ '#text': z.string().optional() }).passthrough(),
])
const rssItemSchema = z
    .object({
        title: xmlTextSchema.optional(),
        link: xmlTextSchema.optional(),
        guid: xmlTextSchema.optional(),
        pubDate: xmlTextSchema.optional(),
        source: xmlTextSchema.optional(),
    })
    .passthrough()
const rssChannelSchema = z
    .union([
        z.object({
            item: z.union([rssItemSchema, z.array(rssItemSchema)]).optional(),
        }),
        z.literal(''),
    ])
    .transform((channel) => (channel === '' ? {} : channel))
const rssDocumentSchema = z.object({
    rss: z
        .object({
            channel: rssChannelSchema.optional(),
        })
        .optional(),
})

type XmlText = z.infer<typeof xmlTextSchema>

// Tag values stay strings (a numeric headline must not become a number)
const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false })

/**
 * Reads the text of an RSS node that may carry attributes (`<source url="…">Name</source>`).
 *
 * @param node - Parsed XML node
 */
function readText(node: XmlText | undefined): string {
    if (Predicate.isString(node)) return node.trim()
    return node?.['#text']?.trim() ?? ''
}

/**
 * Normalizes an XML node that may appear once (object) or several times (array).
 *
 * @param node - Parsed XML node, possibly missing
 */
function toArray<T>(node: T | T[] | undefined): T[] {
    if (node === undefined) return []
    return Array.isArray(node) ? node : [node]
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
    const document = rssDocumentSchema.parse(parser.parse(xml))
    const rawItems = document.rss?.channel?.item
    const items = toArray(rawItems)

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
    asset: Pick<NewsAsset, 'ticker'>,
    { query, fromKeywords }: NewsQuery
): Effect.Effect<NewsItem[], GetGoogleNewsError> {
    return Effect.tryPromise({
        try: async (signal) => {
            const params = new URLSearchParams({ q: query, hl: 'en-US', gl: 'US', ceid: 'US:en' })
            const res = await fetch(`${GOOGLE_NEWS_RSS_URL}?${params}`, { method: 'GET', signal })

            if (!res.ok) throw new Error(`Fetch Failed status=${res.status}`)

            return parseGoogleNewsRss(await res.text(), asset.ticker, fromKeywords)
        },
        catch: (cause) =>
            new GetGoogleNewsError({ cause, message: 'Failed to fetch news from Google News' }),
    })
}
