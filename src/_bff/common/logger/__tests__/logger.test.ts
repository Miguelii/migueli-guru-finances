import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Data } from 'effect'

const afterMock = vi.fn()
const createDBServerClientMock = vi.fn()

vi.mock('server-only', () => ({}))
vi.mock('next/server', () => ({ after: (fn: () => unknown) => afterMock(fn) }))
vi.mock('@/_bff/common/db/db.utils', () => ({
    createDBServerClient: (...args: unknown[]) => createDBServerClientMock(...args),
}))
vi.mock('@/env/server', () => ({ ServerEnv: { NODE_ENV: 'test' } }))

const { Logger, serializeError } = await import('@/_bff/common/logger/logger')

class SampleError extends Data.TaggedError('SampleError')<{
    cause: unknown
    message?: string
    error_hash?: string
}> {}

describe('serializeError', () => {
    it('returns nullish values as-is', () => {
        expect(serializeError(null)).toBeNull()
        // oxlint-disable-next-line unicorn/no-useless-undefined
        expect(serializeError(undefined)).toBeUndefined()
    })

    it('keeps tagged error fields, drops the stack and serializes the cause', () => {
        const error = new SampleError({
            cause: new Error('db down'),
            message: 'query failed',
            error_hash: 'abc12345',
        })

        const result = serializeError(error) as Record<string, unknown>

        expect(result._tag).toBe('SampleError')
        expect(result.message).toBe('query failed')
        expect(result.error_hash).toBe('abc12345')
        expect(result.stack).toBeUndefined()
        expect(result.cause).toMatchObject({ name: 'Error', message: 'db down' })
    })

    it('trims the stack of plain errors to 4 lines', () => {
        const result = serializeError(new TypeError('boom')) as Record<string, unknown>

        expect(result).toMatchObject({ name: 'TypeError', message: 'boom' })
        expect(String(result.stack).split('\n').length).toBeLessThanOrEqual(4)
    })

    it('maps arrays (Effect defects) recursively', () => {
        expect(serializeError([new Error('a'), 'b'])).toEqual([
            expect.objectContaining({ message: 'a' }),
            'b',
        ])
    })
})

describe('Logger', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    it('writes to the console with prefix, message and details', () => {
        Logger({ level: 'error', prefix: 'trpc', message: 'getLogs', userId: 'user-1' })

        expect(console.error).toHaveBeenCalledWith(
            '[trpc] getLogs',
            expect.objectContaining({ userId: 'user-1', timestamp: expect.any(String) })
        )
    })

    it('does not persist outside production', () => {
        Logger({ level: 'error', prefix: 'trpc', error: new Error('boom') })

        expect(afterMock).not.toHaveBeenCalled()
        expect(createDBServerClientMock).not.toHaveBeenCalled()
    })
})
