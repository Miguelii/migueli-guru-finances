import { CACHE_KEYS } from '@/_bff/modules/cache/cache.constants'
import { z } from 'zod'

export const revalidateCacheSchema = z.object({
    key: z.enum(CACHE_KEYS),
})

export type RevalidateCacheProps = z.infer<typeof revalidateCacheSchema>
