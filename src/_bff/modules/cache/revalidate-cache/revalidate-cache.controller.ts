import { Match } from 'effect'
import { protectedProcedure } from '@/_bff/trpc/server'
import { runEffect } from '@/_bff/trpc/utils'
import { revalidateCacheSchema } from '@/_bff/modules/cache/cache.dto'
import { revalidateCache } from '@/_bff/modules/cache/revalidate-cache/revalidate-cache.service'

export const REVALIDATE_CACHE_PROTECTED_CONTROLLER = protectedProcedure
    .input(revalidateCacheSchema)
    .mutation(({ input }) =>
        runEffect(revalidateCache(input), 'revalidateCache', (error) =>
            Match.value(error).pipe(
                Match.tag('DevOnlyActionError', () => 'FORBIDDEN' as const),
                Match.exhaustive
            )
        )
    )
