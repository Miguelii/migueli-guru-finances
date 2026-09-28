import { absurd } from 'effect/Function'
import { protectedProcedure } from '@/_bff/trpc/server'
import { runEffect } from '@/_bff/trpc/utils'
import { getBankConnection } from '@/_bff/modules/bank/get-bank-connection/get-bank-connection.service'

export const GET_BANK_CONNECTION_PROTECTED_CONTROLLER = protectedProcedure.query(({ ctx }) =>
    // The service recovers from every failure (degraded card), so its error channel is
    // `never`: `absurd` stops compiling if a typed error is ever added without a mapping
    runEffect(getBankConnection(ctx.user.id), 'getBankConnection', absurd)
)
