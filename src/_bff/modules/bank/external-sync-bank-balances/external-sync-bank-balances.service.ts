import { Effect, Match } from 'effect'
import { revalidatePath, revalidateTag } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { ServerEnv } from '@/env/server'
import { PRIVATE_ROUTE_PATH } from '@/lib/constants'
import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError, SbQueryError } from '@/_bff/common/errors/shared.errors'
import { createDBServerClient, verifyApiKey } from '@/_bff/common/db/db.utils'
import { Logger } from '@/_bff/common/logger/logger'
import { getEnableBankingConfig } from '@/_bff/modules/bank/helpers/enable-banking-config.helper'
import { GET_BANK_CONNECTION_CACHE_KEY } from '@/_bff/modules/bank/bank.constants'
import { selectActiveConnections } from '@/_bff/modules/bank/bank.repository'
import { syncBankBalance } from '@/_bff/modules/bank/helpers/sync-bank-balance.helper'
import {
    BankNotConfiguredError,
    UnauthorizedSyncBankBalancesError,
} from '@/_bff/modules/bank/bank.errors'

function isAuthorized(request: NextRequest): boolean {
    const apiKey = request.headers.get('x-api-key')
    const expected = ServerEnv.NEXT_SYNC_BANK_SECRET_KEY

    if (!apiKey || !expected) return false

    return verifyApiKey(apiKey, expected)
}

export const externalSyncBankBalances = Effect.fn('externalSyncBankBalances')(
    function* (request: NextRequest) {
        if (!isAuthorized(request)) {
            return yield* new UnauthorizedSyncBankBalancesError({
                cause: null,
                message: 'Unauthorized',
                error_hash: ErrorCode.BANK_SYNC_UNAUTHORIZED,
            })
        }

        const config = getEnableBankingConfig()

        if (!config) {
            return yield* new BankNotConfiguredError({
                cause: null,
                error_hash: ErrorCode.BANK_NOT_CONFIGURED,
            })
        }

        const bd = yield* Effect.tryPromise({
            try: () => createDBServerClient(true),
            catch: (cause) =>
                new CreateSbClientError({ cause, error_hash: ErrorCode.BANK_DB_CLIENT }),
        })

        const { data: connections, error } = yield* Effect.tryPromise({
            try: () => selectActiveConnections(bd),
            catch: (cause) => new SbQueryError({ cause, error_hash: ErrorCode.BANK_GET_QUERY }),
        })

        if (error) {
            return yield* new SbQueryError({
                cause: error,
                message: error.message,
                error_hash: ErrorCode.BANK_GET_QUERY,
            })
        }

        yield* Effect.forEach(
            connections ?? [],
            (connection) => syncBankBalance(bd, config, connection),
            { concurrency: 'unbounded' }
        )

        revalidateTag(GET_BANK_CONNECTION_CACHE_KEY, 'max')
        revalidatePath(PRIVATE_ROUTE_PATH, 'layout')

        return NextResponse.json({ status: 200, synced: connections?.length ?? 0 })
    },
    Effect.catchAll((error) => {
        Logger({
            level: 'error',
            prefix: 'externalSyncBankBalances',
            message: `${error._tag} failed`,
            error,
        })

        return Effect.succeed(
            Match.value(error).pipe(
                Match.tag('UnauthorizedSyncBankBalancesError', () =>
                    NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
                ),
                Match.tag('BankNotConfiguredError', () =>
                    NextResponse.json({ error: 'Not configured' }, { status: 503 })
                ),
                Match.tag('CreateSbClientError', 'SbQueryError', () =>
                    NextResponse.json({ error: 'Internal error' }, { status: 500 })
                ),
                Match.exhaustive
            )
        )
    })
)
