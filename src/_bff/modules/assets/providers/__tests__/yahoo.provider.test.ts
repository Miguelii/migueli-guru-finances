import { Effect, Result } from 'effect'
import { afterEach, describe, it, expect, vi } from 'vitest'
import { getFinancePrices } from '@/_bff/modules/assets/providers/yahoo.provider'
import { Currency } from '@/types/core/Currency'
import { Ticker } from '@/types/core/Ticker'
import { TickerService } from '@/types/core/TickerService'
import { TickerType } from '@/types/core/TickerType'
import type { TickerData } from '@/types/Transaction'

const { quoteMock } = vi.hoisted(() => ({ quoteMock: vi.fn() }))

vi.mock('server-only', () => ({}))
vi.mock('yahoo-finance2', () => ({
    default: class {
        quote = quoteMock
    },
}))

const tick = (ticker: Ticker): TickerData => ({
    ticker,
    curr_price: 0,
    last_updated_at: '2026-01-01 00:00:00',
    service: TickerService.Yahoo,
    currency: Currency.EUR,
    symbol: '€',
    type: TickerType.Stock,
})

const run = <A, E>(effect: Effect.Effect<A, E>) => Effect.runPromise(Effect.result(effect))

afterEach(() => {
    quoteMock.mockReset()
})

describe('getFinancePrices', () => {
    it('should fetch every symbol in a single request', async () => {
        quoteMock.mockResolvedValue({
            'VUAA.DE': { regularMarketPrice: 112.5 },
            'EUR=X': { regularMarketPrice: 0.87 },
        })

        const result = await run(getFinancePrices([tick(Ticker.VUAA), tick(Ticker.USD_EUR)]))

        expect(Result.getOrThrow(result)).toEqual(
            new Map([
                [Ticker.VUAA, 112.5],
                [Ticker.USD_EUR, 0.87],
            ])
        )
        expect(quoteMock).toHaveBeenCalledTimes(1)
        expect(quoteMock).toHaveBeenCalledWith([Ticker.VUAA, Ticker.USD_EUR], {
            return: 'object',
            fields: ['regularMarketPrice', 'bid'],
        })
    })

    it('should fall back to the bid and omit symbols without a price', async () => {
        quoteMock.mockResolvedValue({
            ATCH: { bid: 0.42 },
            NOPRICE: {},
        })

        const result = await run(
            getFinancePrices([tick(Ticker.ATCH), tick(Ticker.BTC), tick(Ticker.ETH)])
        )

        expect(Result.getOrThrow(result)).toEqual(new Map([[Ticker.ATCH, 0.42]]))
    })

    it('should fail with GetFinancePriceError when the request fails', async () => {
        quoteMock.mockRejectedValue(new Error('network'))

        const result = await run(getFinancePrices([tick(Ticker.VUAA)]))

        expect(Result.isFailure(result) && result.failure._tag).toBe('GetFinancePriceError')
    })
})
