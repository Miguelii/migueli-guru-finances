import { TRPCError } from '@trpc/server'
import { Cause, Effect, Exit, Option, Predicate } from 'effect'
import { Logger } from '@/_bff/common/logger/logger'
import { getCachedUserId } from '@/_bff/modules/auth/helpers/get-cached-user-id.helper'

// PostgREST codes for a rejected JWT (invalid/expired or missing claims)
const POSTGREST_JWT_ERROR_CODES = new Set(['PGRST301', 'PGRST302', 'PGRST303'])

/**
 * Whether a failure was caused by PostgREST rejecting the request JWT — the session is no
 * longer valid, so it must surface as UNAUTHORIZED (forced sign-out) instead of a 500.
 * @param cause - The `cause` carried by a tagged error.
 */
export function isJwtRejection(cause: unknown): cause is { code: string } {
    return (
        Predicate.isObject(cause) &&
        'code' in cause &&
        Predicate.isString(cause.code) &&
        POSTGREST_JWT_ERROR_CODES.has(cause.code)
    )
}

export async function runEffect<
    A,
    E extends { _tag: string; error_hash?: string; cause?: unknown } & Error,
>(
    effect: Effect.Effect<A, E>,
    context: string,
    mapCode: (error: E) => TRPCError['code']
): Promise<A> {
    const exit = await Effect.runPromiseExit(effect)

    if (Exit.isSuccess(exit)) return exit.value

    const userId = await getCachedUserId()

    const maybeError = Cause.findErrorOption(exit.cause)

    if (Option.isNone(maybeError)) {
        const defects = exit.cause.reasons.filter(Cause.isDieReason).map((reason) => reason.defect)
        Logger({
            level: 'error',
            prefix: 'trpc',
            message: context,
            error: defects.map((defect) => (Predicate.isError(defect) ? defect : String(defect))),
            userId,
        })
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'unexpected_defect' })
    }

    const error = maybeError.value

    Logger({ level: 'error', prefix: 'trpc', message: context, error, userId })

    const code = isJwtRejection(error.cause) ? 'UNAUTHORIZED' : mapCode(error)

    throw new TRPCError({ code, message: error.error_hash })
}
