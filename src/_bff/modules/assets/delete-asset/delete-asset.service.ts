import { PRIVATE_ROUTE_PATH } from '@/lib/constants'
import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError, SbQueryError } from '@/_bff/common/errors/shared.errors'
import { createDBServerClient } from '@/_bff/common/db/db.utils'
import { GET_ASSETS_CACHE_KEY } from '@/_bff/modules/assets/assets.constants'
import { deleteAssetByTicker } from '@/_bff/modules/assets/assets.repository'
import { Effect } from 'effect'
import { revalidatePath, revalidateTag } from 'next/cache'

export const deleteAsset = Effect.fn('deleteAsset')(function* (ticker: string) {
    const bd = yield* Effect.tryPromise({
        try: () => createDBServerClient(true),
        catch: (cause) =>
            new CreateSbClientError({ cause, error_hash: ErrorCode.ASSETS_DB_CLIENT }),
    })

    const { error } = yield* Effect.tryPromise({
        try: () => deleteAssetByTicker(bd, ticker),
        catch: (cause) => new SbQueryError({ cause, error_hash: ErrorCode.ASSETS_DELETE_QUERY }),
    })

    if (error) {
        return yield* new SbQueryError({
            cause: error,
            message: error?.message,
            error_hash: ErrorCode.ASSETS_DELETE_QUERY,
        })
    }

    revalidateTag(GET_ASSETS_CACHE_KEY, 'max')
    revalidatePath(PRIVATE_ROUTE_PATH, 'layout')
})
