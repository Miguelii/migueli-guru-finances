import { Effect, Result } from 'effect'
import { afterEach, describe, it, expect, vi } from 'vitest'
import { getCoinbasePrices } from '@/_bff/modules/assets/providers/coinbase.provider'
import { Currency } from '@/types/core/Currency'
import type { TickerData } from '@/types/Transaction'

vi.mock('server-only', () => ({}))

const tick = (ticker: string, currency: Currency) =>
    ({ ticker, currency, service: 'coinbase' }) as unknown as TickerData

const ratesByQuote: Record<string, Record<string, string>> = {
    EUR: { BTC: '0.0000125', ETH: '0.0004347183459836', USDC: '1.1188185276348176' },
    USD: { MON: '40' },
}

const mockRates = () =>
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
        const quote = new URL(String(input)).searchParams.get('currency') ?? ''
        return new Response(
            JSON.stringify({ data: { currency: quote, rates: ratesByQuote[quote] } })
        )
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
                tick('BTC', Currency.EUR),
                tick('ETH', Currency.EUR),
                tick('MON', Currency.USD),
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

        const result = await run(getCoinbasePrices([tick('USDC-EUR', Currency.USDC)]))

        expect(Result.getOrThrow(result)).toEqual(new Map([['USDC-EUR', 0.8938]]))
        expect(fetchSpy).toHaveBeenCalledWith(
            'https://api.coinbase.com/v2/exchange-rates?currency=EUR',
            expect.anything()
        )
    })

    it('should omit assets Coinbase has no rate for', async () => {
        mockRates()

        const result = await run(
            getCoinbasePrices([tick('BTC', Currency.EUR), tick('UNKNOWN', Currency.EUR)])
        )

        expect(Result.getOrThrow(result)).toEqual(new Map([['BTC', 80000]]))
    })

    it('should fail with GetCoinbasePriceError on a non-ok response', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('down', { status: 503 }))

        const result = await run(getCoinbasePrices([tick('BTC', Currency.EUR)]))

        expect(Result.isFailure(result) && result.failure._tag).toBe('GetCoinbasePriceError')
    })
})
