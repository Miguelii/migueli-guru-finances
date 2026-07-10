import { initTRPC, TRPCError } from '@trpc/server'
import { Effect, Exit } from 'effect'
import type { Context } from '@/_trpc/context'
import { getSession } from '@/_bff/modules/auth/get-session.helper'

const t = initTRPC.context<Context>().create()

/**
 * Unprotected procedure
 **/
export const publicProcedure = t.procedure

/**
 * Resolves the session once (request-cached) and injects the authenticated
 * `user` into ctx. Infrastructure failures map to 500; a missing user maps to
 * 401. Protected services receive `ctx.user` and no longer resolve the session
 * themselves — they keep creating their own Supabase client for queries so each
 * one stays in control of which key (publishable vs service-role) it uses.
 **/
const isAuthed = t.middleware(async ({ next }) => {
    const session = await Effect.runPromiseExit(getSession())

    if (Exit.isFailure(session)) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
    }

    const user = session.value

    if (!user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    return next({ ctx: { user } })
})

/**
 * Protected procedure — guarantees a non-null authenticated `ctx.user`.
 **/
export const protectedProcedure = t.procedure.use(isAuthed)

export const router = t.router
