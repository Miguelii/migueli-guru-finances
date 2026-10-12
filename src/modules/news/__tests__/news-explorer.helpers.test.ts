import { describe, it, expect } from 'vitest'
import { ALL_NEWS_ASSETS } from '@/lib/constants/news'
import {
    buildAssetFilterOptions,
    countRecentNews,
    filterByAsset,
} from '@/modules/news/news-explorer.helpers'
import { NewsProvider, PortfolioEventType, type NewsItem, type PortfolioEvent } from '@/types/News'
import { Ticker, type TickerData } from '@/types/Transaction'

const item = (ticker: Ticker, publishedAt = '2026-10-12T09:00:00.000Z'): NewsItem => ({
    id: `${ticker}:${publishedAt}`,
    ticker,
    title: 'Title',
    source: 'Source',
    url: 'https://example.com',
    publishedAt,
    provider: NewsProvider.Yahoo,
    fromKeywords: false,
})

const event = (ticker: Ticker): PortfolioEvent => ({
    id: ticker,
    ticker,
    type: PortfolioEventType.Earnings,
    date: '2026-10-28',
    isEstimate: false,
})

const asset = (ticker: Ticker) => ({ ticker, logo: null }) as unknown as TickerData

describe('buildAssetFilterOptions', () => {
    it('should list assets with news or events, most news first', () => {
        const options = buildAssetFilterOptions(
            [asset(Ticker.ATCH), asset(Ticker.BTC), asset(Ticker.ETH), asset(Ticker.VUAA)],
            [item(Ticker.BTC), item(Ticker.BTC), item(Ticker.ATCH)],
            [event(Ticker.VUAA)]
        )

        expect(
            options.map((option) => [option.ticker, option.newsCount, option.eventCount])
        ).toEqual([
            [Ticker.BTC, 2, 0],
            [Ticker.ATCH, 1, 0],
            [Ticker.VUAA, 0, 1],
        ])
    })
})

describe('filterByAsset', () => {
    it('should keep one asset or everything', () => {
        const news = [item(Ticker.BTC), item(Ticker.ETH)]

        expect(filterByAsset(news, Ticker.ETH)).toEqual([item(Ticker.ETH)])
        expect(filterByAsset(news, ALL_NEWS_ASSETS)).toBe(news)
    })
})

describe('countRecentNews', () => {
    it('should count the stories inside the window', () => {
        const now = new Date('2026-10-12T12:00:00Z')
        const news = [
            item(Ticker.BTC, '2026-10-12T09:00:00.000Z'),
            item(Ticker.BTC, '2026-10-06T09:00:00.000Z'),
            item(Ticker.BTC, '2026-10-01T09:00:00.000Z'),
        ]

        expect(countRecentNews(news, now, 7)).toBe(2)
    })
})
