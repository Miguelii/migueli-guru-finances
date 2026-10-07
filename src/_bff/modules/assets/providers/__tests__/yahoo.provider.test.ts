import { Effect, Result } from 'effect'
import { afterEach, describe, it, expect, vi } from 'vitest'
import { getFinancePrices } from '@/_bff/modules/assets/providers/yahoo.provider'
import type { TickerData } from '@/types/Transaction'

const { quoteMock } = vi.hoisted(() => ({ quoteMock: vi.fn() }))

vi.mock('server-only', () => ({}))
vi.mock('yahoo-finance2', () => ({
    default: class {
        quote = quoteMock
    },
}))

const tick = (ticker: string) => ({ ticker, service: 'yahoo' }) as unknown as TickerData

const run = <A, E>(effect: Effect.Effect<A, E>) => Effect.runPromise(Effect.result(effect))

afterEach(() => {
    quoteMock.mockReset()
})

describe('getFinancePrices', () => {
    it('should fetch every symbol in a single request', async () => {
        quoteMock.mockResolvedValue({
            VUAA: { regularMarketPrice: 112.5 },
            'EUR=X': { regularMarketPrice: 0.87 },
        })

        const result = await run(getFinancePrices([tick('vuaa'), tick('EUR=X')]))

        expect(Result.getOrThrow(result)).toEqual(
            new Map([
                ['vuaa', 112.5],
                ['EUR=X', 0.87],
            ])
        )
        expect(quoteMock).toHaveBeenCalledTimes(1)
        expect(quoteMock).toHaveBeenCalledWith(['VUAA', 'EUR=X'], {
            return: 'object',
            fields: ['regularMarketPrice', 'bid'],
        })
    })

    it('should fall back to the bid and omit symbols without a price', async () => {
        quoteMock.mockResolvedValue({
            ATCH: { bid: 0.42 },
            NOPRICE: {},
        })

        const result = await run(getFinancePrices([tick('ATCH'), tick('NOPRICE'), tick('UNKNOWN')]))

        expect(Result.getOrThrow(result)).toEqual(new Map([['ATCH', 0.42]]))
    })

    it('should fail with GetFinancePriceError when the request fails', async () => {
        quoteMock.mockRejectedValue(new Error('network'))

        const result = await run(getFinancePrices([tick('VUAA')]))

        expect(Result.isFailure(result) && result.failure._tag).toBe('GetFinancePriceError')
    })
})
