import { beforeEach, describe, expect, it, vi } from 'vitest'
import { revalidatePath, revalidateTag } from 'next/cache'
import { expireCacheTags } from '@/_bff/common/cache/expire-cache-tags.helper'

vi.mock('next/cache', () => ({ revalidateTag: vi.fn(), revalidatePath: vi.fn() }))

describe('expireCacheTags', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('expires every tag immediately', () => {
        expireCacheTags('a', 'b')
        expect(revalidateTag).toHaveBeenCalledWith('a', { expire: 0 })
        expect(revalidateTag).toHaveBeenCalledWith('b', { expire: 0 })
        expect(revalidatePath).not.toHaveBeenCalled()
    })
})
