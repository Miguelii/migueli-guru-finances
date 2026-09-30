import { Effect } from 'effect'
import { revalidatePath, revalidateTag } from 'next/cache'
import { ErrorCode } from '@/_bff/common/errors/error-codes'
import type { RevalidateCacheProps } from '@/_bff/modules/cache/cache.dto'
import { DevOnlyActionError } from '@/_bff/modules/cache/cache.errors'
import { PRIVATE_ROUTE_PATH } from '@/lib/constants'
import { getIsDev } from '@/lib/utils/index.server'

export const revalidateCache = Effect.fn('revalidateCache')(function* ({
    key,
}: RevalidateCacheProps) {
    if (!getIsDev()) {
        return yield* new DevOnlyActionError({
            cause: null,
            message: 'Only available in development',
            error_hash: ErrorCode.CACHE_REVALIDATE_DEV_ONLY,
        })
    }

    // `expire: 0` drops the entries now: 'max' would serve the stale data once more
    revalidateTag(key, { expire: 0 })
    revalidatePath(PRIVATE_ROUTE_PATH, 'layout')

    return { key, revalidatedAt: new Date().toISOString() }
})
