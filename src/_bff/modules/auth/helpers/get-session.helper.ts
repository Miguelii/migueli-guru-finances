import { cache } from 'react'
import { Effect } from 'effect'
import {
    AuthInvalidJwtError,
    isAuthApiError,
    isAuthSessionMissingError,
    type AuthApiError,
    type AuthSessionMissingError,
    type JwtPayload,
    type SupabaseClient,
    type UserMetadata,
} from '@supabase/supabase-js'
import { createDBServerClient } from '@/_bff/common/db/db.utils'
import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError } from '@/_bff/common/errors/shared.errors'
import { GetUserError } from '@/_bff/modules/auth/auth.errors'

export type SessionUser = {
    id: string
    user_metadata: UserMetadata
}

type SessionResult =
    | { ok: true; user: SessionUser | null }
    | { ok: false; kind: 'sb-client'; cause: unknown }
    | { ok: false; kind: 'get-user'; cause: unknown }

const INVALID_SESSION_STATUSES = new Set([400, 401, 403, 404])

/**
 * Whether a `getClaims()` error means the session itself is invalid (missing, expired,
 * revoked, bad JWT signature, refresh token already used) rather than an infrastructure failure.
 * @param error - The error returned by `supabase.auth.getClaims()`.
 */
export function isInvalidSessionError(
    error: unknown
): error is AuthApiError | AuthSessionMissingError | AuthInvalidJwtError {
    if (isAuthSessionMissingError(error)) return true
    if (error instanceof AuthInvalidJwtError) return true
    return isAuthApiError(error) && INVALID_SESSION_STATUSES.has(error.status)
}

/**
 * Maps verified JWT claims to the user shape the tRPC context exposes.
 * @param claims - The claims returned by `supabase.auth.getClaims()`.
 */
export function toSessionUser(claims: JwtPayload): SessionUser {
    return { id: claims.sub, user_metadata: claims.user_metadata ?? {} }
}

/**
 * Resolves the current user once per request.
 *
 * Wrapped in React `cache()` with no arguments, so every `getSession()` call
 * within the same server request shares a single `supabase.auth.getClaims()`
 * call. With asymmetric JWT signing keys the token is verified locally against
 * the cached JWKS, so there is no network round-trip to Supabase Auth (with a
 * legacy HS256 key it falls back to `getUser()`). A session revoked elsewhere
 * stays valid until its access token expires. The cache is request-scoped
 * (isolated across requests), so there is no risk of leaking one user's session
 * into another.
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
        const { data, error } = await bd.auth.getClaims()

        if (!error) {
            return { ok: true, user: data?.claims ? toSessionUser(data.claims) : null }
        }

        // Only a rejected session means "no user" (→ 401 → forced sign-out). Network or
        // Supabase Auth outages surface as infrastructure failures so users are not
        // signed out by a transient error.
        if (isInvalidSessionError(error)) return { ok: true, user: null }

        return { ok: false, kind: 'get-user', cause: error }
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
