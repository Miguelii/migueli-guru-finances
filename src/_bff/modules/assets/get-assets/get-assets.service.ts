import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError, SbQueryError } from '@/_bff/common/errors/shared.errors'
import { createDBServerClient } from '@/_bff/common/db/db.utils'
import { getAssetsFn } from '@/_bff/modules/assets/assets.repository'
import { Effect } from 'effect'

export const getAssets = Effect.fn('getAssets')(function* (userId: string) {
    const bd = yield* Effect.tryPromise({
        try: () => createDBServerClient(),
        catch: (cause) =>
            new CreateSbClientError({ cause, error_hash: ErrorCode.ASSETS_DB_CLIENT }),
    })

    const data = yield* Effect.tryPromise({
        try: () => getAssetsFn(bd, userId)(),
        catch: (cause) => new SbQueryError({ cause, error_hash: ErrorCode.ASSETS_GET_ALL_QUERY }),
    })

    return data ?? []
})
