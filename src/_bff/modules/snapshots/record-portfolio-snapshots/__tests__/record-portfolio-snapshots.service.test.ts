import { Effect } from 'effect'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { UserTransaction } from '@/_bff/modules/snapshots/snapshots.repository'
import { Ticker } from '@/types/core/Ticker'
import { TransactionType } from '@/types/Transaction'

vi.mock('server-only', () => ({}))

const { revalidateTag, revalidatePath } = vi.hoisted(() => ({
    revalidateTag: vi.fn(),
    revalidatePath: vi.fn(),
}))

vi.mock('next/cache', () => ({ revalidateTag, revalidatePath }))

vi.mock('@/_bff/common/db/db.utils', () => ({
    createDBServerClient: vi.fn(() => Promise.resolve({})),
}))

vi.mock('@/_bff/common/logger/logger', () => ({ Logger: vi.fn() }))

const transaction: UserTransaction = {
    id: 'tx-1',
    user_id: 'user-1',
    ticker_id: Object.values(Ticker)[0],
    type: TransactionType.Buy,
    buy_date: '2026-01-10 10:00:00',
    value: 100,
    quantity: 1,
    transaction_price: 100,
    fee: 0,
}

vi.mock('@/_bff/modules/snapshots/snapshots.repository', () => ({
    selectAllTickers: vi.fn(() => Promise.resolve({ data: [], error: null })),
    selectAllTransactions: vi.fn(() => Promise.resolve([transaction])),
    upsertSnapshots: vi.fn(() => Promise.resolve({ error: null })),
}))

const { recordPortfolioSnapshots } =
    await import('@/_bff/modules/snapshots/record-portfolio-snapshots/record-portfolio-snapshots.service')

describe('recordPortfolioSnapshots', () => {
    beforeEach(() => {
        revalidateTag.mockClear()
        revalidatePath.mockClear()
    })

    it('expires the global snapshots tag immediately', async () => {
        await Effect.runPromise(recordPortfolioSnapshots())

        expect(revalidateTag).toHaveBeenCalledWith('getPortfolioSnapshots', { expire: 0 })
    })
})
