import { describe, it, expect, vi } from 'vitest'
import { SELECT_PAGE_SIZE, selectAllPages } from '@/_bff/common/db/select-all-pages.helper'

vi.mock('server-only', () => ({}))

describe('selectAllPages', () => {
    it('reads a single page when it comes back short', async () => {
        const fetchPage = vi.fn().mockResolvedValue({ data: [1, 2, 3], error: null })
        expect(await selectAllPages(fetchPage)).toEqual([1, 2, 3])
        expect(fetchPage).toHaveBeenCalledTimes(1)
        expect(fetchPage).toHaveBeenCalledWith(0, 999)
    })

    it('keeps reading while pages come back full', async () => {
        const full = Array.from({ length: SELECT_PAGE_SIZE }, (_, index) => index)
        const fetchPage = vi
            .fn()
            .mockResolvedValueOnce({ data: full, error: null })
            .mockResolvedValueOnce({ data: full, error: null })
            .mockResolvedValueOnce({ data: [7, 8, 9], error: null })
        const rows = await selectAllPages(fetchPage)
        expect(rows).toHaveLength(2003)
        expect(fetchPage.mock.calls).toEqual([
            [0, 999],
            [1000, 1999],
            [2000, 2999],
        ])
    })

    it('throws the query error', async () => {
        const error = new Error('boom')
        await expect(selectAllPages(vi.fn().mockResolvedValue({ data: null, error }))).rejects.toBe(
            error
        )
    })
})
