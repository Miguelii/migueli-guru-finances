import type { NewsItem } from '@/types/News'
import { TickerType, type TickerData } from '@/types/Transaction'
import {
    NEWS_KEYWORD_SLOTS_PER_ASSET,
    NEWS_MAX_AGE_DAYS,
    NEWS_MAX_ITEMS,
    NEWS_PER_ASSET,
} from '@/_bff/modules/news/news.constants'

export type NewsQuery = {
    query: string
    fromKeywords: boolean
}

export type NewsAsset = Pick<
    TickerData,
    'ticker' | 'type' | 'service' | 'currency' | 'news_keywords'
>

// Legal-form suffixes left out of the name search ("AtlasClear Holdings, Inc." → "AtlasClear")
const CORPORATE_SUFFIXES = new Set([
    'inc',
    'corp',
    'corporation',
    'company',
    'co',
    'ltd',
    'plc',
    'holdings',
    'sa',
    'nv',
    'ag',
    'se',
])

// Quote currency Yahoo appends to crypto names ("Bitcoin USD")
const QUOTE_CURRENCIES = new Set(['USD', 'EUR'])

const DAY_MS = 86_400_000

/**
 * Symbol Yahoo files an asset's news under: the ticker itself for stocks and ETFs,
 * `<BASE>-USD` for crypto (Yahoo has no news for the EUR pairs).
 *
 * @param asset - The asset (`ticker` like 'BTC' or 'USDC-EUR', and its type)
 */
export function toYahooNewsSymbol(asset: Pick<NewsAsset, 'ticker' | 'type'>): string {
    const ticker = asset.ticker.toUpperCase()
    if (asset.type !== TickerType.Crypto) return ticker

    const [base] = ticker.split('-')
    return `${base}-USD`
}

/**
 * Strips what makes a Yahoo name a poor search phrase: the UCITS share class of an ETF,
 * the quote currency of a crypto pair and trailing legal-form suffixes.
 *
 * @param name - Yahoo `longName` / `shortName` (e.g. 'Vanguard S&P 500 UCITS ETF USD Accumulation')
 */
export function cleanAssetName(name: string): string {
    // String operations and a single-class split keep this linear on untrusted names
    const ucitsIndex = name.toUpperCase().indexOf(' UCITS')
    const base = ucitsIndex === -1 ? name : name.slice(0, ucitsIndex)
    const words = base.split(/[\s,]+/u).filter(Boolean)

    if (words.length > 1 && QUOTE_CURRENCIES.has(words.at(-1)!)) words.pop()

    while (words.length > 1 && CORPORATE_SUFFIXES.has(toSuffixKey(words.at(-1)!))) words.pop()

    return words.join(' ')
}

/**
 * Lowercased word without a trailing period, to match it against the legal suffixes.
 *
 * @param word - Last word of a name (e.g. 'Inc.')
 */
function toSuffixKey(word: string): string {
    const lower = word.toLowerCase()
    return lower.endsWith('.') ? lower.slice(0, -1) : lower
}

/**
 * Google News queries for an asset: the exact (cleaned) name, falling back to the
 * ticker, plus the user's extra search terms when set.
 *
 * @param asset - The asset (ticker and optional `news_keywords`)
 * @param name - Yahoo name of the asset, when known
 */
export function buildNewsQueries(
    asset: Pick<NewsAsset, 'ticker' | 'news_keywords'>,
    name?: string
): NewsQuery[] {
    const cleanName = name ? cleanAssetName(name) : ''
    const nameQuery = `"${cleanName || asset.ticker}"`
    const keywords = asset.news_keywords?.trim()
    const queries: NewsQuery[] = [{ query: nameQuery, fromKeywords: false }]

    if (keywords && keywords !== nameQuery) queries.push({ query: keywords, fromKeywords: true })

    return queries
}

/**
 * Whether a link from an external feed is safe to render (`https:` only, never
 * `javascript:` or other schemes).
 *
 * @param url - The untrusted link
 */
export function isSafeUrl(url: unknown): url is string {
    if (typeof url !== 'string') return false

    try {
        return new URL(url).protocol === 'https:'
    } catch {
        return false
    }
}

/**
 * Lowercased title with punctuation collapsed, so the same story from two feeds
 * (different quotes, dashes or spacing) dedupes.
 *
 * @param title - News title
 */
function normalizeTitle(title: string): string {
    return title
        .toLowerCase()
        .replaceAll(/[^\p{L}\p{N}]+/gu, ' ')
        .trim()
}

/**
 * Merges the news of every source: drops items older than the max age, keeps the
 * newest copy of each story per asset and caps the items per asset. The asset's own
 * search terms get the first {@link NEWS_KEYWORD_SLOTS_PER_ASSET} slots, the rest goes
 * to the newest stories. Returns the items newest first, capped in total.
 *
 * @param items - News from every source and asset (any order)
 * @param now - Reference instant for the max age
 */
export function mergeNews(items: NewsItem[], now: Date): NewsItem[] {
    const oldest = now.getTime() - NEWS_MAX_AGE_DAYS * DAY_MS
    const seen = new Set<string>()
    const perAsset = new Map<string, number>()
    const merged: NewsItem[] = []

    const sorted = items
        .filter((item) => new Date(item.publishedAt).getTime() >= oldest)
        .toSorted((a, b) => b.publishedAt.localeCompare(a.publishedAt))

    const accept = (item: NewsItem, limit: number) => {
        const key = `${item.ticker}:${normalizeTitle(item.title)}`
        const count = perAsset.get(item.ticker) ?? 0

        if (seen.has(key) || count >= limit) return

        seen.add(key)
        perAsset.set(item.ticker, count + 1)
        merged.push(item)
    }

    for (const item of sorted) {
        if (item.fromKeywords) accept(item, NEWS_KEYWORD_SLOTS_PER_ASSET)
    }

    for (const item of sorted) accept(item, NEWS_PER_ASSET)

    return merged
        .toSorted((a, b) => b.publishedAt.localeCompare(a.publishedAt))
        .slice(0, NEWS_MAX_ITEMS)
}
