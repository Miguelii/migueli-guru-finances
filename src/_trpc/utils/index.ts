import { TRPCError } from '@trpc/server'
import { Cause, Effect, Exit, Option } from 'effect'
import { Logger } from '@/_bff/common/logger/logger'
import { getCachedUserId } from '@/_bff/modules/auth/get-cached-user-id.helper'

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

    throw new TRPCError({ code: mapCode(error), message: error.error_hash })
}
