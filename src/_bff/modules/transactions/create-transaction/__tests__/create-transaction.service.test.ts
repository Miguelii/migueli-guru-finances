import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PostgrestError } from '@supabase/supabase-js'
import { Effect, Exit } from 'effect'
import { revalidatePath, revalidateTag } from 'next/cache'
import { createTransaction } from '@/_bff/modules/transactions/create-transaction/create-transaction.service'
import { type CreateTransactionProps } from '@/_bff/modules/transactions/transactions.dto'
import { insertTransaction } from '@/_bff/modules/transactions/transactions.repository'
import { TransactionType } from '@/types/Transaction'

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidateTag: vi.fn(), revalidatePath: vi.fn() }))
vi.mock('@/_bff/common/db/db.utils', () => ({
    createDBServerClient: vi.fn().mockResolvedValue({}),
}))
vi.mock('@/_bff/modules/transactions/transactions.repository', () => ({
    insertTransaction: vi.fn(),
}))

type InsertResult = Awaited<ReturnType<typeof insertTransaction>>

const SUCCESS_RESULT: InsertResult = {
    error: null,
    data: null,
    count: null,
    status: 201,
    statusText: 'Created',
    success: true,
}

const FAILURE_RESULT: InsertResult = {
    error: new PostgrestError({ message: 'x', details: '', hint: '', code: '500' }),
    data: null,
    count: null,
    status: 500,
    statusText: 'Error',
    success: false,
}

const input: CreateTransactionProps = {
    ticker_id: 'BTC',
    type: TransactionType.Buy,
    buy_date: '2026-01-01 10:00:00',
    quantity: 1,
    transaction_price: 100,
    value: 100,
    fee: 0,
}

describe('createTransaction', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(insertTransaction).mockResolvedValue(SUCCESS_RESULT)
    })

    it('expires only the owner transactions tag', async () => {
        await Effect.runPromise(createTransaction('user-1', input))
        expect(revalidateTag).toHaveBeenCalledWith('getAllTransactions:user-1', { expire: 0 })
        expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('does not touch the cache when the insert fails', async () => {
        vi.mocked(insertTransaction).mockResolvedValueOnce(FAILURE_RESULT)
        const exit = await Effect.runPromiseExit(createTransaction('user-1', input))
        expect(Exit.isFailure(exit)).toBe(true)
        expect(revalidateTag).not.toHaveBeenCalled()
    })
})
