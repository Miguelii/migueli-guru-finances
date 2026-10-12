import { describe, it, expect } from 'vitest'
import { groupNewsByDay } from '@/modules/news/news-feed.helpers'
import { NewsProvider, type NewsItem } from '@/types/News'
import { Ticker } from '@/types/Transaction'

const item = (publishedAt: string, ticker = Ticker.BTC): NewsItem => ({
    id: `${ticker}:${publishedAt}`,
    ticker,
    title: 'Title',
    source: 'Source',
    url: 'https://example.com',
    publishedAt,
    provider: NewsProvider.Yahoo,
    fromKeywords: false,
})

describe('groupNewsByDay', () => {
    it('should group by Lisbon day with Today and Yesterday labels', () => {
        const now = new Date('2026-10-12T12:00:00Z')
        const groups = groupNewsByDay(
            [
                item('2026-10-12T09:00:00.000Z'),
                // 23:30 UTC is already the next day in Lisbon (summer time)
                item('2026-10-10T23:30:00.000Z'),
                item('2026-10-08T10:00:00.000Z'),
            ],
            now
        )

        expect(groups.map((group) => [group.day, group.label])).toEqual([
            ['2026-10-12', 'Today'],
            ['2026-10-11', 'Yesterday'],
            ['2026-10-08', '8 de outubro'],
        ])
    })
})
