import { PRIVATE_ROUTE_PATH } from '@/lib/constants'
import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError, SbQueryError } from '@/_bff/common/errors/shared.errors'
import { createDBServerClient } from '@/_bff/common/db/db.utils'
import { GET_ASSETS_CACHE_KEY } from '@/_bff/modules/assets/assets.constants'
import { type CreateAssetProps } from '@/_bff/modules/assets/assets.dto'
import { updateAssetByTicker } from '@/_bff/modules/assets/assets.repository'
import { uploadAssetImage } from '@/_bff/modules/assets/upload-asset-image.helper'
import { Effect } from 'effect'
import { revalidatePath, revalidateTag } from 'next/cache'

export const updateAsset = Effect.fn('updateAsset')(function* (props: CreateAssetProps) {
    const bd = yield* Effect.tryPromise({
        try: () => createDBServerClient(true),
        catch: (cause) =>
            new CreateSbClientError({ cause, error_hash: ErrorCode.ASSETS_DB_CLIENT }),
    })

    const { image, ...assetProps } = props

    const logoPath = image ? yield* uploadAssetImage(bd, assetProps.ticker, image) : undefined

    const { error } = yield* Effect.tryPromise({
        try: () => updateAssetByTicker(bd, { ...assetProps, logo: logoPath }),
        catch: (cause) => new SbQueryError({ cause, error_hash: ErrorCode.ASSETS_UPDATE_QUERY }),
    })

    if (error) {
        return yield* new SbQueryError({
            cause: error,
            message: error?.message,
            error_hash: ErrorCode.ASSETS_UPDATE_QUERY,
        })
    }

    revalidateTag(GET_ASSETS_CACHE_KEY, 'max')
    revalidatePath(PRIVATE_ROUTE_PATH, 'layout')
})
