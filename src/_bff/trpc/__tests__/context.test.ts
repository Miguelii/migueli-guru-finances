import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Effect } from 'effect'
import { createContext } from '@/_bff/trpc/context'
import { protectedProcedure, router } from '@/_bff/trpc/server'

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))

vi.mock('@/_bff/modules/auth/helpers/get-session.helper', () => ({ getSession }))

const USER = { id: 'user-1', user_metadata: {} }

const testRouter = router({
    first: protectedProcedure.query(({ ctx }) => ctx.user.id),
    second: protectedProcedure.query(({ ctx }) => ctx.user.id),
})

describe('createContext', () => {
    beforeEach(() => {
        getSession.mockReset()
        getSession.mockImplementation(() => Effect.succeed(USER))
    })

    it('resolves the session once for every procedure of a batched request', async () => {
        const caller = testRouter.createCaller(await createContext())

        const ids = await Promise.all([caller.first(), caller.second()])

        expect(ids).toEqual(['user-1', 'user-1'])
        expect(getSession).toHaveBeenCalledTimes(1)
    })

    it('resolves the session again for a new request', async () => {
        await testRouter.createCaller(await createContext()).first()
        await testRouter.createCaller(await createContext()).first()

        expect(getSession).toHaveBeenCalledTimes(2)
    })
})
