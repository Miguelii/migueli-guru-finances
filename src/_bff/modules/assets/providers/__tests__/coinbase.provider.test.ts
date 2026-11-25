import { Effect, Result } from 'effect'
import { afterEach, describe, it, expect, vi } from 'vitest'
import { getCoinbasePrices } from '@/_bff/modules/assets/providers/coinbase.provider'
import { Currency } from '@/types/core/Currency'
import { Ticker } from '@/types/core/Ticker'
import { TickerService } from '@/types/core/TickerService'
import { TickerType } from '@/types/core/TickerType'
import type { TickerData } from '@/types/Transaction'

vi.mock('server-only', () => ({}))

const tick = (ticker: Ticker, currency: Currency): TickerData => ({
    ticker,
    curr_price: 0,
    last_updated_at: '2026-01-01 00:00:00',
    service: TickerService.Coinbase,
    currency,
    symbol: '€',
    type: TickerType.Crypto,
})

const ratesByQuote = {
    EUR: { BTC: '0.0000125', ETH: '0.0004347183459836', USDC: '1.1188185276348176' },
    USD: { MON: '40' },
}

const mockRates = () =>
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
        const quote = new URL(String(input)).searchParams.get('currency') ?? ''
        let rates: Record<string, string> | undefined

        switch (quote) {
            case 'EUR':
                rates = ratesByQuote.EUR
                break
            case 'USD':
                rates = ratesByQuote.USD
                break
        }

        return new Response(JSON.stringify({ data: { currency: quote, rates } }))
    })

const run = <A, E>(effect: Effect.Effect<A, E>) => Effect.runPromise(Effect.result(effect))

afterEach(() => {
    vi.restoreAllMocks()
})

describe('getCoinbasePrices', () => {
    it('should make one request per quote currency and invert the rates', async () => {
        const fetchSpy = mockRates()

        const result = await run(
            getCoinbasePrices([
                tick(Ticker.BTC, Currency.EUR),
                tick(Ticker.ETH, Currency.EUR),
                tick(Ticker.MON, Currency.USD),
            ])
        )

        expect(Result.getOrThrow(result)).toEqual(
            new Map([
                ['BTC', 80000],
                ['ETH', 2300.34],
                ['MON', 0.025],
            ])
        )
        expect(fetchSpy).toHaveBeenCalledTimes(2)
        expect(fetchSpy).toHaveBeenCalledWith(
            'https://api.coinbase.com/v2/exchange-rates?currency=EUR',
            expect.objectContaining({ method: 'GET' })
        )
        expect(fetchSpy).toHaveBeenCalledWith(
            'https://api.coinbase.com/v2/exchange-rates?currency=USD',
            expect.objectContaining({ method: 'GET' })
        )
    })

    it('should resolve tickers that already name the full pair', async () => {
        const fetchSpy = mockRates()

        const result = await run(getCoinbasePrices([tick(Ticker.USDC_EUR, Currency.USDC)]))

        expect(Result.getOrThrow(result)).toEqual(new Map([['USDC-EUR', 0.8938]]))
        expect(fetchSpy).toHaveBeenCalledWith(
            'https://api.coinbase.com/v2/exchange-rates?currency=EUR',
            expect.anything()
        )
    })

    it('should omit assets Coinbase has no rate for', async () => {
        mockRates()

        const result = await run(
            getCoinbasePrices([tick(Ticker.BTC, Currency.EUR), tick(Ticker.ATCH, Currency.EUR)])
        )

        expect(Result.getOrThrow(result)).toEqual(new Map([['BTC', 80000]]))
    })

    it('should fail with GetCoinbasePriceError on a non-ok response', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('down', { status: 503 }))

        const result = await run(getCoinbasePrices([tick(Ticker.BTC, Currency.EUR)]))

        expect(Result.isFailure(result) && result.failure._tag).toBe('GetCoinbasePriceError')
    })

    it('passes an abort signal to fetch', async () => {
        const fetchSpy = mockRates()
        await Effect.runPromise(getCoinbasePrices([tick(Ticker.BTC, Currency.EUR)]))
        expect(fetchSpy.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal)
    })

    it('aborts the request when the effect times out', async () => {
        let signal: AbortSignal | undefined
        vi.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => {
            signal = init?.signal ?? undefined
            return new Promise(() => {})
        })
        const result = await Effect.runPromise(
            getCoinbasePrices([tick(Ticker.BTC, Currency.EUR)]).pipe(
                Effect.timeout('10 millis'),
                Effect.result
            )
        )
        expect(Result.isFailure(result)).toBe(true)
        expect(signal?.aborted).toBe(true)
    })
})
