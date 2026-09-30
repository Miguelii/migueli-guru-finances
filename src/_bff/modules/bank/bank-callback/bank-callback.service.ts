import { Effect } from 'effect'
import { revalidatePath, revalidateTag } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { HOME_PAGE_PATH, PRIVATE_ROUTE_PATH } from '@/lib/constants'
import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError, SbQueryError } from '@/_bff/common/errors/shared.errors'
import { createDBServerClient } from '@/_bff/common/db/db.utils'
import { Logger } from '@/_bff/common/logger/logger'
import { getSession } from '@/_bff/modules/auth/helpers/get-session.helper'
import { getEnableBankingConfig } from '@/_bff/modules/bank/helpers/enable-banking-config.helper'
import { getBankConnectionCacheTag } from '@/_bff/modules/bank/bank.constants'
import { syncBankBalance } from '@/_bff/modules/bank/helpers/sync-bank-balance.helper'
import { createSession } from '@/_bff/modules/bank/providers/enable-banking.provider'
import { findConnectionByPendingState, saveBankSession } from '@/_bff/modules/bank/bank.repository'
import {
    BankAccountNotFoundError,
    BankNotConfiguredError,
    InvalidBankStateError,
} from '@/_bff/modules/bank/bank.errors'

const BANK_RESULT_PARAM = 'bank'

function redirectToPortfolio(request: NextRequest, result: 'connected' | 'error') {
    const url = new URL(PRIVATE_ROUTE_PATH, request.url)
    url.searchParams.set(BANK_RESULT_PARAM, result)
    return NextResponse.redirect(url)
}

export const bankCallback = Effect.fn('bankCallback')(
    function* (request: NextRequest) {
        const user = yield* getSession()

        if (!user) return NextResponse.redirect(new URL(HOME_PAGE_PATH, request.url))

        const { searchParams } = request.nextUrl
        const code = searchParams.get('code')
        const state = searchParams.get('state')

        // Enable Banking redirects with `error` when the user cancels or the bank refuses
        if (searchParams.has('error') || !code || !state) {
            return yield* new InvalidBankStateError({
                cause: { error: searchParams.get('error'), hasCode: Boolean(code) },
                message: searchParams.get('error_description') ?? 'Missing code or state',
                error_hash: ErrorCode.BANK_INVALID_STATE,
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

        const { data: connection, error: findError } = yield* Effect.tryPromise({
            try: () => findConnectionByPendingState(bd, user.id, state),
            catch: (cause) => new SbQueryError({ cause, error_hash: ErrorCode.BANK_GET_QUERY }),
        })

        if (findError) {
            return yield* new SbQueryError({
                cause: findError,
                message: findError.message,
                error_hash: ErrorCode.BANK_GET_QUERY,
            })
        }

        if (!connection) {
            return yield* new InvalidBankStateError({
                cause: null,
                message: 'Unknown or already used state',
                error_hash: ErrorCode.BANK_INVALID_STATE,
            })
        }

        const session = yield* createSession(config, code)
        const account = session.accounts[0]

        if (!account) {
            return yield* new BankAccountNotFoundError({
                cause: null,
                message: 'The authorized session has no accounts',
                error_hash: ErrorCode.BANK_NO_ACCOUNT,
            })
        }

        const { error: saveError } = yield* Effect.tryPromise({
            try: () =>
                saveBankSession(bd, connection.id, {
                    sessionId: session.session_id,
                    accountUid: account.uid,
                    consentValidUntil: session.access.valid_until,
                }),
            catch: (cause) => new SbQueryError({ cause, error_hash: ErrorCode.BANK_UPDATE_QUERY }),
        })

        if (saveError) {
            return yield* new SbQueryError({
                cause: saveError,
                message: saveError.message,
                error_hash: ErrorCode.BANK_UPDATE_QUERY,
            })
        }

        yield* syncBankBalance(bd, config, {
            ...connection,
            account_uid: account.uid,
            consent_valid_until: session.access.valid_until,
        })

        revalidateTag(getBankConnectionCacheTag(user.id), 'max')
        revalidatePath(PRIVATE_ROUTE_PATH, 'layout')

        return redirectToPortfolio(request, 'connected')
    },
    (effect, request) =>
        effect.pipe(
            Effect.catchAll((error) => {
                Logger({
                    level: 'error',
                    prefix: 'bankCallback',
                    message: `${error._tag} failed`,
                    error,
                })
                return Effect.succeed(redirectToPortfolio(request, 'error'))
            })
        )
)
