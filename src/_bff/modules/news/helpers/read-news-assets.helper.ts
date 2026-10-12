import { Effect } from 'effect'
import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError, SbQueryError } from '@/_bff/common/errors/shared.errors'
import { createDBServerClient } from '@/_bff/common/db/db.utils'
import { Logger } from '@/_bff/common/logger/logger'
import type { NewsAsset } from '@/_bff/modules/news/helpers/news.helper'
import { getNewsAssetsFn } from '@/_bff/modules/news/news.repository'

const selectNewsAssets = Effect.fn('selectNewsAssets')(function* (tickers: string[]) {
    const bd = yield* Effect.tryPromise({
        try: () => createDBServerClient(),
        catch: (cause) => new CreateSbClientError({ cause, error_hash: ErrorCode.NEWS_DB_CLIENT }),
    })

    return yield* Effect.tryPromise({
        try: () => getNewsAssetsFn(bd, tickers)(),
        catch: (cause) => new SbQueryError({ cause, error_hash: ErrorCode.NEWS_GET_QUERY }),
    })
})

// Never fails: the news page degrades to its empty states when the assets cannot be read
export const readNewsAssets = Effect.fn('readNewsAssets')(function* (
    tickers: string[],
    userId: string
) {
    if (tickers.length === 0) return []

    return yield* selectNewsAssets(tickers).pipe(
        Effect.catch((error) => {
            Logger({
                level: 'error',
                prefix: 'readNewsAssets',
                message: `${error._tag} failed`,
                error,
                userId,
            })

            return Effect.succeed<NewsAsset[]>([])
        })
    )
})
