import { revalidateTag } from 'next/cache'

/**
 * Expires the given cache tags immediately (not stale-while-revalidate), so the next read
 * after a user mutation already sees fresh data.
 * @param tags cache tags to expire
 */
export function expireCacheTags(...tags: string[]): void {
    for (const tag of tags) {
        revalidateTag(tag, { expire: 0 })
    }
}
