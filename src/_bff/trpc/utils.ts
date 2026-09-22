import { TRPCError } from '@trpc/server'
import { Cause, Effect, Exit, Option } from 'effect'
import { Logger } from '@/_bff/common/logger/logger'
import { getCachedUserId } from '@/_bff/modules/auth/get-cached-user-id.helper'

// PostgREST codes for a rejected JWT (invalid/expired or missing claims)
const POSTGREST_JWT_ERROR_CODES = new Set(['PGRST301', 'PGRST302', 'PGRST303'])

/**
 * Whether a failure was caused by PostgREST rejecting the request JWT — the session is no
 * longer valid, so it must surface as UNAUTHORIZED (forced sign-out) instead of a 500.
 * @param cause - The `cause` carried by a tagged error.
 */
export function isJwtRejection(cause: unknown): boolean {
    return (
        typeof cause === 'object' &&
        cause !== null &&
        'code' in cause &&
        typeof cause.code === 'string' &&
        POSTGREST_JWT_ERROR_CODES.has(cause.code)
    )
}

export async function runEffect<A, E extends { _tag: string; error_hash?: string }>(
    effect: Effect.Effect<A, E>,
    context: string,
    mapCode: (error: E) => TRPCError['code']
): Promise<A> {
    const exit = await Effect.runPromiseExit(effect)

    if (Exit.isSuccess(exit)) return exit.value

    const userId = await getCachedUserId()

    const maybeError = Cause.failureOption(exit.cause)

    if (Option.isNone(maybeError)) {
        const defects = Cause.defects(exit.cause)
        Logger.error(`[trpc Effect] [${context}] failed USER_ID=|${userId}|`, defects)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'unexpected_defect' })
    }

    const error = maybeError.value

    Logger.error(`[trpc Effect] [${context}] failed USER_ID=|${userId}|`, error)

    const code = isJwtRejection((error as { cause?: unknown }).cause)
        ? 'UNAUTHORIZED'
        : mapCode(error)

    throw new TRPCError({ code, message: error.error_hash })
}
