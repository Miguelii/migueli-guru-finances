import { Effect, Result } from 'effect'
import { afterEach, describe, it, expect, vi } from 'vitest'
import {
    getGoogleNews,
    parseGoogleNewsRss,
} from '@/_bff/modules/news/providers/google-news.provider'
import { NewsProvider } from '@/types/News'
import { Ticker } from '@/types/core/Ticker'
import { TickerType } from '@/types/core/TickerType'

vi.mock('server-only', () => ({}))

const asset = { ticker: Ticker.ATCH, type: TickerType.Stock }

const RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>Google News</title>
<item>
  <title>AtlasClear wins court ruling &amp; more - Reuters</title>
  <link>https://news.google.com/rss/articles/abc</link>
  <guid isPermaLink="false">abc</guid>
  <pubDate>Mon, 12 Oct 2026 14:30:00 GMT</pubDate>
  <source url="https://www.reuters.com">Reuters</source>
</item>
<item>
  <title>2026</title>
  <link>javascript:alert(1)</link>
  <pubDate>Mon, 12 Oct 2026 14:30:00 GMT</pubDate>
  <source url="https://x.com">X</source>
</item>
</channel></rss>`

const run = <A, E>(effect: Effect.Effect<A, E>) => Effect.runPromise(Effect.result(effect))

afterEach(() => {
    vi.restoreAllMocks()
})

describe('parseGoogleNewsRss', () => {
    it('should strip the source suffix and drop unsafe links', () => {
        expect(parseGoogleNewsRss(RSS, Ticker.ATCH, true)).toEqual([
            {
                id: 'google:ATCH:abc',
                ticker: Ticker.ATCH,
                title: 'AtlasClear wins court ruling & more',
                source: 'Reuters',
                url: 'https://news.google.com/rss/articles/abc',
                publishedAt: '2026-10-12T14:30:00.000Z',
                provider: NewsProvider.Google,
                fromKeywords: true,
            },
        ])
    })

    it('should handle a feed without items', () => {
        expect(parseGoogleNewsRss('<rss><channel></channel></rss>', Ticker.ATCH, false)).toEqual([])
    })
})

describe('getGoogleNews', () => {
    it('should send the query to the RSS search', async () => {
        const fetchSpy = vi
            .spyOn(globalThis, 'fetch')
            .mockResolvedValue(new Response(RSS, { status: 200 }))

        const result = await run(
            getGoogleNews(asset, { query: 'AtlasClear lawsuit', fromKeywords: true })
        )

        expect(new URL(String(fetchSpy.mock.calls[0]?.[0])).searchParams.get('q')).toBe(
            'AtlasClear lawsuit'
        )
        expect(Result.isSuccess(result) && result.success).toHaveLength(1)
    })

    it('should fail on a non-ok response', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 503 }))

        const result = await run(getGoogleNews(asset, { query: 'AtlasClear', fromKeywords: false }))

        expect(Result.isFailure(result) && result.failure._tag).toBe('GetGoogleNewsError')
    })

    it('passes an abort signal to fetch', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(RSS))
        await Effect.runPromise(getGoogleNews(asset, { query: 'AtlasClear', fromKeywords: false }))
        expect(fetchSpy.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal)
    })

    it('aborts the request when the effect times out', async () => {
        let signal: AbortSignal | undefined
        vi.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => {
            signal = init?.signal ?? undefined
            return new Promise(() => {})
        })
        const result = await Effect.runPromise(
            getGoogleNews(asset, { query: 'AtlasClear', fromKeywords: false }).pipe(
                Effect.timeout('10 millis'),
                Effect.result
            )
        )
        expect(Result.isFailure(result)).toBe(true)
        expect(signal?.aborted).toBe(true)
    })
})
