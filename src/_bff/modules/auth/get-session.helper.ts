import { cache } from 'react'
import { Effect } from 'effect'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createDBServerClient } from '@/_bff/common/db/db.utils'
import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError } from '@/_bff/common/errors/shared.errors'
import { GetUserError } from './auth.errors'

type SessionResult =
    | { ok: true; user: User | null }
    | { ok: false; kind: 'sb-client'; cause: unknown }
    | { ok: false; kind: 'get-user'; cause: unknown }

/**
 * Resolves the current user once per request.
 *
 * Wrapped in React `cache()` with no arguments, so every `getSession()` call
 * within the same server request shares a single `supabase.auth.getUser()`
 * round-trip (it revalidates the JWT against Supabase Auth, which is a network
 * call). The cache is request-scoped — isolated across requests, so there is no
 * risk of leaking one user's session into another.
 *
 * Never rejects: infrastructure failures are returned as a tagged result so the
 * Effect layer can map them back to the same error types as before.
 */
const resolveUser = cache(async (): Promise<SessionResult> => {
    let bd: SupabaseClient

    try {
        bd = await createDBServerClient()
    } catch (cause) {
        return { ok: false, kind: 'sb-client', cause }
    }

    try {
        const { data, error } = await bd.auth.getUser()
        return { ok: true, user: error ? null : (data?.user ?? null) }
    } catch (cause) {
        return { ok: false, kind: 'get-user', cause }
    }
})

// `client` is kept for call-site compatibility. The auth check always goes
// through the request-cached `resolveUser` so it can be deduplicated regardless
// of which client a caller passes.
export const getSession = Effect.fn('getSession')(function* (_client?: SupabaseClient) {
    const result = yield* Effect.promise(() => resolveUser())

    if (!result.ok) {
        if (result.kind === 'sb-client') {
            return yield* new CreateSbClientError({
                cause: result.cause,
                error_hash: ErrorCode.AUTH_SESSION_DB_CLIENT,
            })
        }

        return yield* new GetUserError({
            cause: result.cause,
            error_hash: ErrorCode.AUTH_SESSION_GET_USER,
        })
    }

    return result.user
})
