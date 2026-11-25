import { Effect, type Exit } from 'effect'
import type { CreateSbClientError } from '@/_bff/common/errors/shared.errors'
import type { GetUserError } from '@/_bff/modules/auth/auth.errors'
import { getSession, type SessionUser } from '@/_bff/modules/auth/helpers/get-session.helper'

type SessionExit = Exit.Exit<SessionUser | null, CreateSbClientError | GetUserError>

export type Context = {
    session: () => Promise<SessionExit>
}

/**
 * Creates the context for an incoming request. `session` resolves the user once per context:
 * React `cache()` does not dedupe in Route Handlers, so without it each procedure of a batched
 * `/api/trpc` request would verify the JWT (and refresh an expired session) on its own.
 * @see https://trpc.io/docs/v11/context
 */
export const createContext = async (): Promise<Context> => {
    let session: Promise<SessionExit> | undefined

    return { session: () => (session ??= Effect.runPromiseExit(getSession())) }
}
