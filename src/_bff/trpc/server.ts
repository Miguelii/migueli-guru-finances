import { initTRPC, TRPCError } from '@trpc/server'
import { Exit } from 'effect'
import type { Context } from '@/_bff/trpc/context'

const t = initTRPC.context<Context>().create()

/**
 * Unprotected procedure
 **/
export const publicProcedure = t.procedure

/**
 * Reads the session from the context (resolved once per request, verified locally from
 * the JWT claims via `getClaims()`) and injects the authenticated `user` into ctx.
 * Infrastructure failures map to 500; a missing user maps to 401. Protected services
 * receive `ctx.user` and no longer resolve the session themselves: they keep creating
 * their own Supabase client for queries so each one stays in control of which key
 * (publishable vs service-role) it uses.
 **/
const isAuthed = t.middleware(async ({ ctx, next }) => {
    const session = await ctx.session()

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
 * Protected procedure: guarantees a non-null authenticated `ctx.user`.
 **/
export const protectedProcedure = t.procedure.use(isAuthed)

export const router = t.router
