import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TRPCClientError, type Operation } from '@trpc/client'
import { observable, observableToPromise } from '@trpc/server/observable'
import { FORCE_SIGN_OUT_API_PATH } from '@/lib/constants'

const assign = vi.fn()

function makeError(code: string) {
    return new TRPCClientError('failed', {
        result: { error: { message: 'failed', code: -1, data: { code } } },
    } as never)
}

async function runLink(error: TRPCClientError<never>) {
    const { unauthorizedLink } = await import('@/_trpc/client/unauthorized-link')
    const op = {
        id: 1,
        type: 'query',
        path: 'assets.getAll',
        input: undefined,
        context: {},
        signal: null,
    } as unknown as Operation
    const result = unauthorizedLink({} as never)({
        op,
        next: () => observable((observer) => observer.error(error as never)),
    })
    return observableToPromise(result)
}

describe('unauthorizedLink', () => {
    beforeEach(() => {
        vi.resetModules()
        assign.mockClear()
        Object.defineProperty(window, 'location', { value: { assign }, writable: true })
    })

    it('redirects to the forced sign-out once and forwards the error', async () => {
        const error = makeError('UNAUTHORIZED')
        const { unauthorizedLink } = await import('@/_trpc/client/unauthorized-link')
        const link = unauthorizedLink({} as never)
        const next = () => observable((observer) => observer.error(error as never))
        const op = {} as Operation

        await expect(observableToPromise(link({ op, next }))).rejects.toBe(error)
        await expect(observableToPromise(link({ op, next }))).rejects.toBe(error)

        expect(assign).toHaveBeenCalledTimes(1)
        expect(assign).toHaveBeenCalledWith(FORCE_SIGN_OUT_API_PATH)
    })

    it('does not redirect on other error codes', async () => {
        const error = makeError('INTERNAL_SERVER_ERROR')

        await expect(runLink(error)).rejects.toBe(error)
        expect(assign).not.toHaveBeenCalled()
    })
})
