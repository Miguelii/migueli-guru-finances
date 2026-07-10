import { PRIVATE_ROUTE_PATH } from '@/lib/constants'
import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError, SbQueryError } from '@/_bff/common/errors/shared.errors'
import { createSbServerClient } from '@/_bff/common/supabase/supabase.client'
import { GET_ASSETS_CACHE_KEY } from '@/_bff/modules/assets/assets.constants'
import { deleteAssetByTicker } from '@/_bff/modules/assets/assets.repository'
import { Effect } from 'effect'
import { revalidatePath, revalidateTag } from 'next/cache'

export const deleteAsset = Effect.fn('deleteAsset')(function* (ticker: string) {
    const supabase = yield* Effect.tryPromise({
        try: () => createSbServerClient(true),
        catch: (cause) =>
            new CreateSbClientError({ cause, error_hash: ErrorCode.ASSETS_SB_CLIENT }),
    })

    const { error } = yield* Effect.tryPromise({
        try: () => deleteAssetByTicker(supabase, ticker),
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
