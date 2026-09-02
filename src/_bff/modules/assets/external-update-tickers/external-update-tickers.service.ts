import { ServerEnv } from '@/env/server'
import { PRIVATE_ROUTE_PATH } from '@/lib/constants'
import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { createDBServerClient, verifyApiKey } from '@/_bff/common/db/db.utils'
import { updateTickersPrices } from '@/_bff/modules/assets/update-tickers-prices/update-tickers-prices.service'
import { GET_ASSETS_CACHE_KEY } from '@/_bff/modules/assets/assets.constants'
import { GET_ALL_TRANSACTIONS_CACHE_KEY } from '@/_bff/modules/transactions/transactions.constants'
import {
    UnauthorizedUpdateTickersError,
    UpdateTickersStatusError,
} from '@/_bff/modules/assets/assets.errors'
import { Effect, Match } from 'effect'
import { revalidatePath, revalidateTag } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { checkBotId } from 'botid/server'

/**
 * Validates request authorization and bot protection.
 * API key requests skip bot check (for supabase-to-server requests).
 * Browser requests require both auth and bot check.
 * @param request - The incoming request
 */
async function isAuthorizedHandler(request: NextRequest): Promise<boolean> {
    const apiKey = request.headers.get('x-api-key')

    if (apiKey) {
        return verifyApiKey(apiKey, ServerEnv.NEXT_UPDATE_TICKERS_SECRET_KEY)
    }

    const { isBot } = await checkBotId()

    if (isBot) return false

    const bd = await createDBServerClient()
    const { data } = await bd.auth.getUser()

    return !!data.user
}

/**
 * Handles the `POST /api/updateTickers` request: authorizes, updates ticker prices,
 * and revalidates the affected caches on success.
 * @param request - The incoming request
 */
export async function externalUpdateTickers(request: NextRequest): Promise<NextResponse> {
    const program = Effect.gen(function* () {
        const isAuthorized = yield* Effect.promise(() => isAuthorizedHandler(request))

        if (!isAuthorized) {
            return yield* new UnauthorizedUpdateTickersError({
                cause: null,
                message: 'Unauthorized',
                error_hash: ErrorCode.ASSETS_UPDATE_TICKERS_FAILED,
            })
        }

        const result = yield* Effect.promise(() => updateTickersPrices())

        if (!result.success) {
            return yield* new UpdateTickersStatusError({
                cause: result,
                message: String(result.status),
                error_hash: ErrorCode.ASSETS_UPDATE_TICKERS_FAILED,
            })
        }

        revalidateTag(GET_ASSETS_CACHE_KEY, 'max')
        revalidateTag(GET_ALL_TRANSACTIONS_CACHE_KEY, 'max')
        revalidatePath(PRIVATE_ROUTE_PATH, 'layout')

        return NextResponse.json({ status: 200 })
    }).pipe(
        Effect.catchAll((error) => {
            return Effect.succeed(
                Match.value(error).pipe(
                    Match.tag('UnauthorizedUpdateTickersError', () =>
                        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
                    ),
                    Match.tag('UpdateTickersStatusError', (updateError) =>
                        NextResponse.json(
                            { status: Number(updateError.message) },
                            { status: Number(updateError.message) }
                        )
                    ),
                    Match.exhaustive
                )
            )
        })
    )

    return Effect.runPromise(program)
}
