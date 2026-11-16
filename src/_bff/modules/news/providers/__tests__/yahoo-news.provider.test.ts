import { Effect, Result } from 'effect'
import { afterEach, describe, it, expect, vi } from 'vitest'
import {
    getYahooCalendarEvents,
    getYahooNames,
    getYahooNews,
} from '@/_bff/modules/news/providers/yahoo-news.provider'
import { PortfolioEventType } from '@/types/News'
import { Ticker } from '@/types/core/Ticker'
import { TickerType } from '@/types/core/TickerType'

const { searchMock, quoteSummaryMock, quoteMock } = vi.hoisted(() => ({
    searchMock: vi.fn(),
    quoteSummaryMock: vi.fn(),
    quoteMock: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('yahoo-finance2', () => ({
    default: class {
        search = searchMock
        quoteSummary = quoteSummaryMock
        quote = quoteMock
    },
}))

const stock = { ticker: Ticker.ATCH, type: TickerType.Stock }
const crypto = { ticker: Ticker.BTC, type: TickerType.Crypto }

const run = <A, E>(effect: Effect.Effect<A, E>) => Effect.runPromise(Effect.result(effect))

afterEach(() => {
    searchMock.mockReset()
    quoteSummaryMock.mockReset()
    quoteMock.mockReset()
})

describe('getYahooNews', () => {
    it('should search the crypto news under the USD pair and drop unsafe links', async () => {
        searchMock.mockResolvedValue({
            news: [
                {
                    uuid: 'a',
                    title: 'BTC rallies',
                    publisher: '99bitcoins',
                    link: 'https://finance.yahoo.com/a',
                    providerPublishTime: new Date('2026-10-12T11:41:02.000Z'),
                },
                {
                    uuid: 'b',
                    title: 'Bad link',
                    publisher: 'X',
                    link: 'javascript:alert(1)',
                    providerPublishTime: new Date('2026-10-12T11:41:02.000Z'),
                },
            ],
        })

        const result = await run(getYahooNews(crypto))

        expect(searchMock).toHaveBeenCalledWith('BTC-USD', { newsCount: 10, quotesCount: 0 })
        expect(Result.isSuccess(result) && result.success.map((item) => item.title)).toEqual([
            'BTC rallies',
        ])
    })
})

describe('getYahooCalendarEvents', () => {
    it('should map earnings and dividend dates to UTC day keys', async () => {
        quoteSummaryMock.mockResolvedValue({
            calendarEvents: {
                earnings: {
                    earningsDate: [new Date('2026-10-28T20:00:00.000Z')],
                    earningsCallDate: [],
                    isEarningsDateEstimate: true,
                },
                exDividendDate: new Date('2026-11-04T00:00:00.000Z'),
            },
        })

        const result = await run(getYahooCalendarEvents(stock))

        expect(Result.isSuccess(result) && result.success).toEqual([
            {
                id: 'ATCH:EARNINGS:2026-10-28',
                ticker: Ticker.ATCH,
                type: PortfolioEventType.Earnings,
                date: '2026-10-28',
                isEstimate: true,
            },
            {
                id: 'ATCH:EX_DIVIDEND:2026-11-04',
                ticker: Ticker.ATCH,
                type: PortfolioEventType.ExDividend,
                date: '2026-11-04',
                isEstimate: false,
            },
        ])
    })

    it('should fail when Yahoo has no calendar', async () => {
        quoteSummaryMock.mockRejectedValue(new Error('No fundamentals data found'))

        const result = await run(getYahooCalendarEvents(stock))

        expect(Result.isFailure(result) && result.failure._tag).toBe('GetYahooEventsError')
    })
})

describe('getYahooNames', () => {
    it('should name every asset with one request, preferring the long name', async () => {
        quoteMock.mockResolvedValue({
            [Ticker.ATCH]: { longName: 'AtlasClear Holdings, Inc.', shortName: 'AtlasClear' },
            [`${Ticker.BTC}-USD`]: { shortName: 'Bitcoin USD' },
        })

        const result = await run(getYahooNames([stock, crypto]))

        expect(quoteMock).toHaveBeenCalledTimes(1)
        expect(Result.isSuccess(result) && Object.fromEntries(result.success)).toEqual({
            [Ticker.ATCH]: 'AtlasClear Holdings, Inc.',
            [Ticker.BTC]: 'Bitcoin USD',
        })
    })
})
