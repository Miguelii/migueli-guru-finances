import { describe, it, expect } from 'vitest'
import {
    buildNewsQueries,
    cleanAssetName,
    isSafeUrl,
    mergeNews,
    toYahooNewsSymbol,
} from '@/_bff/modules/news/helpers/news.helper'
import { NewsProvider, type NewsItem } from '@/types/News'
import { Ticker, TickerType } from '@/types/Transaction'

const news = (overrides: Partial<NewsItem> & { title: string; publishedAt: string }): NewsItem => ({
    id: overrides.title,
    ticker: Ticker.BTC,
    source: 'Source',
    url: 'https://example.com',
    provider: NewsProvider.Yahoo,
    fromKeywords: false,
    ...overrides,
})

describe('toYahooNewsSymbol', () => {
    it('should keep stock and ETF tickers and quote crypto in USD', () => {
        expect(toYahooNewsSymbol({ ticker: 'VUAA.L' as Ticker, type: TickerType.Etf })).toBe(
            'VUAA.L'
        )
        expect(toYahooNewsSymbol({ ticker: Ticker.BTC, type: TickerType.Crypto })).toBe('BTC-USD')
        expect(toYahooNewsSymbol({ ticker: Ticker.USDC_EUR, type: TickerType.Crypto })).toBe(
            'USDC-USD'
        )
    })
})

describe('cleanAssetName', () => {
    it('should drop legal suffixes, UCITS share classes and quote currencies', () => {
        expect(cleanAssetName('AtlasClear Holdings, Inc.')).toBe('AtlasClear')
        expect(cleanAssetName('Alphabet Inc.')).toBe('Alphabet')
        expect(cleanAssetName('Vanguard S&P 500 UCITS ETF USD Accumulation')).toBe(
            'Vanguard S&P 500'
        )
        expect(cleanAssetName('Bitcoin USD')).toBe('Bitcoin')
    })
})

describe('buildNewsQueries', () => {
    it('should search the exact name and add the extra terms when set', () => {
        expect(
            buildNewsQueries(
                { ticker: Ticker.ATCH, news_keywords: ' AtlasClear lawsuit ' },
                'AtlasClear Holdings, Inc.'
            )
        ).toEqual([
            { query: '"AtlasClear"', fromKeywords: false },
            { query: 'AtlasClear lawsuit', fromKeywords: true },
        ])
    })

    it('should fall back to the ticker without a name', () => {
        expect(buildNewsQueries({ ticker: Ticker.MON, news_keywords: null })).toEqual([
            { query: '"MON"', fromKeywords: false },
        ])
    })
})

describe('isSafeUrl', () => {
    it('should only accept https links', () => {
        expect(isSafeUrl('https://finance.yahoo.com/a')).toBe(true)
        expect(isSafeUrl('http://example.com')).toBe(false)
        expect(isSafeUrl('javascript:alert(1)')).toBe(false)
        expect(isSafeUrl('not a url')).toBe(false)
        expect(isSafeUrl(null)).toBe(false)
    })
})

describe('mergeNews', () => {
    const now = new Date('2026-10-12T12:00:00Z')

    it('should sort newest first and drop stories older than 30 days', () => {
        const result = mergeNews(
            [
                news({ title: 'Old', publishedAt: '2026-09-01T10:00:00.000Z' }),
                news({ title: 'Older recent', publishedAt: '2026-10-10T10:00:00.000Z' }),
                news({ title: 'Newest', publishedAt: '2026-10-12T10:00:00.000Z' }),
            ],
            now
        )

        expect(result.map((item) => item.title)).toEqual(['Newest', 'Older recent'])
    })

    it('should dedupe the same story per asset across sources', () => {
        const result = mergeNews(
            [
                news({ title: 'BTC hits $90K!', publishedAt: '2026-10-12T10:00:00.000Z' }),
                news({
                    id: 'google',
                    title: 'BTC hits $90K',
                    provider: NewsProvider.Google,
                    publishedAt: '2026-10-12T09:00:00.000Z',
                }),
                news({
                    id: 'eth',
                    ticker: Ticker.ETH,
                    title: 'BTC hits $90K',
                    publishedAt: '2026-10-12T09:00:00.000Z',
                }),
            ],
            now
        )

        expect(result.map((item) => item.id)).toEqual(['BTC hits $90K!', 'eth'])
    })

    it('should cap the items per asset', () => {
        const items = Array.from({ length: 12 }, (_, index) =>
            news({
                title: `Story ${index}`,
                publishedAt: `2026-10-${String(index + 1).padStart(2, '0')}T10:00:00.000Z`,
            })
        )

        expect(mergeNews(items, now)).toHaveLength(8)
    })

    it('should keep slots for the search terms when the name search floods the asset', () => {
        const nameResults = Array.from({ length: 10 }, (_, index) =>
            news({
                title: `Name story ${index}`,
                publishedAt: `2026-10-${String(index + 2).padStart(2, '0')}T10:00:00.000Z`,
            })
        )
        const lawsuit = news({
            title: 'Court hearing set',
            fromKeywords: true,
            publishedAt: '2026-09-20T10:00:00.000Z',
        })

        const result = mergeNews([...nameResults, lawsuit], now)

        expect(result).toHaveLength(8)
        expect(result.at(-1)?.title).toBe('Court hearing set')
    })
})
