import { PRIVATE_ROUTE_PATH } from '@/lib/constants'
import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError, SbQueryError } from '@/_bff/common/errors/shared.errors'
import { createDBServerClient } from '@/_bff/common/db/db.utils'
import { GET_ASSETS_CACHE_KEY } from '@/_bff/modules/assets/assets.constants'
import { type CreateAssetProps } from '@/_bff/modules/assets/assets.dto'
import { insertAsset } from '@/_bff/modules/assets/assets.repository'
import { fetchPrice } from '@/_bff/modules/assets/update-tickers-prices/update-tickers-prices.service'
import { uploadAssetImage } from '@/_bff/modules/assets/upload-asset-image.helper'
import type { TickerData } from '@/types/Transaction'
import { Effect } from 'effect'
import { revalidatePath, revalidateTag } from 'next/cache'

export const createAsset = Effect.fn('createAsset')(function* (props: CreateAssetProps) {
    const bd = yield* Effect.tryPromise({
        try: () => createDBServerClient(true),
        catch: (cause) =>
            new CreateSbClientError({ cause, error_hash: ErrorCode.ASSETS_DB_CLIENT }),
    })

    const { image, ...assetProps } = props

    const logoPath = image ? yield* uploadAssetImage(bd, assetProps.ticker, image) : null

    const price = yield* fetchPrice({ ...assetProps, curr_price: 0 } as TickerData)

    const { error } = yield* Effect.tryPromise({
        try: () =>
            insertAsset(bd, {
                ...assetProps,
                logo: logoPath,
                curr_price: price ?? 0,
                last_updated_at: 'now()',
            }),
        catch: (cause) => new SbQueryError({ cause, error_hash: ErrorCode.ASSETS_CREATE_QUERY }),
    })

    if (error) {
        return yield* new SbQueryError({
            cause: error,
            message: error?.message,
            error_hash: ErrorCode.ASSETS_CREATE_QUERY,
        })
    }

    revalidateTag(GET_ASSETS_CACHE_KEY, 'max')
    revalidatePath(PRIVATE_ROUTE_PATH, 'layout')
})
