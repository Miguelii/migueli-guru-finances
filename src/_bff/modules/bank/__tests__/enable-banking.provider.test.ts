import { Effect, Either } from 'effect'
import { afterEach, describe, it, expect, vi } from 'vitest'
import {
    createSession,
    getAccountBalances,
} from '@/_bff/modules/bank/providers/enable-banking.provider'
import type { EnableBankingConfig } from '@/_bff/modules/bank/helpers/enable-banking-config.helper'

vi.mock('server-only', () => ({}))
vi.mock('@/_bff/modules/bank/helpers/enable-banking-jwt.helper', () => ({
    signEnableBankingJwt: () => 'test.jwt.token',
}))

const config: EnableBankingConfig = {
    appId: 'app-id',
    privateKey: 'unused',
    aspspName: 'Test Bank',
    aspspCountry: 'DE',
    appUrl: 'https://wallet.test',
}

const mockFetch = (status: number, body: unknown) =>
    vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(
            new Response(typeof body === 'string' ? body : JSON.stringify(body), { status })
        )

const run = <A, E>(effect: Effect.Effect<A, E>) => Effect.runPromise(Effect.either(effect))

afterEach(() => {
    vi.restoreAllMocks()
})

describe('getAccountBalances', () => {
    it('should return the parsed balances and send the bearer token', async () => {
        const fetchSpy = mockFetch(200, {
            balances: [
                {
                    name: 'Booked',
                    balance_type: 'CLBD',
                    balance_amount: { amount: '1500.25', currency: 'EUR' },
                },
            ],
        })

        const result = await run(getAccountBalances(config, 'acc/1'))

        expect(Either.getOrThrow(result)).toEqual([
            { balance_type: 'CLBD', balance_amount: { amount: '1500.25', currency: 'EUR' } },
        ])
        expect(fetchSpy).toHaveBeenCalledWith(
            'https://api.enablebanking.com/accounts/acc%2F1/balances',
            expect.objectContaining({
                method: 'GET',
                headers: expect.objectContaining({ Authorization: 'Bearer test.jwt.token' }),
            })
        )
    })

    it('should fail with a consent error on 401', async () => {
        mockFetch(401, { error: 'UNAUTHORIZED' })

        const result = await run(getAccountBalances(config, 'acc'))

        expect(Either.isLeft(result) && result.left._tag).toBe('EnableBankingConsentError')
    })

    it('should fail with a consent error when the error code mentions the session', async () => {
        mockFetch(422, { code: 'EXPIRED_SESSION' })

        const result = await run(getAccountBalances(config, 'acc'))

        expect(Either.isLeft(result) && result.left._tag).toBe('EnableBankingConsentError')
    })

    it('should fail with a rate limit error on 429 without retrying', async () => {
        const fetchSpy = mockFetch(429, { code: 429, error: 'ASPSP_RATE_LIMIT_EXCEEDED' })

        const result = await run(getAccountBalances(config, 'acc'))

        expect(Either.isLeft(result) && result.left._tag).toBe('EnableBankingRateLimitError')
        expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it('should fail with a request error on other 4xx without retrying', async () => {
        const fetchSpy = mockFetch(400, { code: 'WRONG_REQUEST_PARAMETERS' })

        const result = await run(getAccountBalances(config, 'acc'))

        expect(Either.isLeft(result) && result.left._tag).toBe('EnableBankingRequestError')
        expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it('should fail with a request error on an unexpected response shape', async () => {
        mockFetch(200, { unexpected: true })

        const result = await run(getAccountBalances(config, 'acc'))

        expect(Either.isLeft(result) && result.left._tag).toBe('EnableBankingRequestError')
    })
})

describe('createSession', () => {
    it('should POST the code and return the session', async () => {
        const fetchSpy = mockFetch(200, {
            session_id: 'session-1',
            accounts: [{ uid: 'account-1', name: 'Cash' }],
            access: { valid_until: '2026-12-25T00:00:00Z' },
        })

        const result = await run(createSession(config, 'auth-code'))

        expect(Either.getOrThrow(result)).toEqual({
            session_id: 'session-1',
            accounts: [{ uid: 'account-1' }],
            access: { valid_until: '2026-12-25T00:00:00Z' },
        })
        expect(fetchSpy).toHaveBeenCalledWith(
            'https://api.enablebanking.com/sessions',
            expect.objectContaining({ method: 'POST', body: JSON.stringify({ code: 'auth-code' }) })
        )
    })
})
