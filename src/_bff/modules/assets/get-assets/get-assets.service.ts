import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError, SbQueryError } from '@/_bff/common/errors/shared.errors'
import { createSbServerClient } from '@/_bff/common/supabase/supabase.client'
import { getAssetsFn } from '@/_bff/modules/assets/assets.repository'
import { Effect } from 'effect'

export const getAssets = Effect.fn('getAssets')(function* (userId: string) {
    const supabase = yield* Effect.tryPromise({
        try: () => createSbServerClient(),
        catch: (cause) =>
            new CreateSbClientError({ cause, error_hash: ErrorCode.ASSETS_SB_CLIENT }),
    })

    const data = yield* Effect.tryPromise({
        try: () => getAssetsFn(supabase, userId)(),
        catch: (cause) => new SbQueryError({ cause, error_hash: ErrorCode.ASSETS_GET_ALL_QUERY }),
    })

    return data ?? []
})
