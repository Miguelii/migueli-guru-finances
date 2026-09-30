import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError, SbQueryError } from '@/_bff/common/errors/shared.errors'
import { createDBServerClient } from '@/_bff/common/db/db.utils'
import { LOGS_FETCH_LIMIT } from '@/_bff/modules/logs/logs.constants'
import type { GetLogsProps } from '@/_bff/modules/logs/logs.dto'
import { selectLogs } from '@/_bff/modules/logs/logs.repository'
import { LOG_RANGE_MS } from '@/lib/constants/logs'
import type { LogEntry } from '@/types/Log'
import { Effect } from 'effect'

export const getLogs = Effect.fn('getLogs')(function* ({ range, search }: GetLogsProps) {
    const bd = yield* Effect.tryPromise({
        try: () => createDBServerClient(true),
        catch: (cause) => new CreateSbClientError({ cause, error_hash: ErrorCode.LOGS_DB_CLIENT }),
    })

    const since = new Date(Date.now() - LOG_RANGE_MS[range]).toISOString()

    const { data, error } = yield* Effect.tryPromise({
        try: () => selectLogs(bd, { since, search: search || undefined }),
        catch: (cause) => new SbQueryError({ cause, error_hash: ErrorCode.LOGS_GET_QUERY }),
    })

    if (error) {
        return yield* new SbQueryError({
            cause: error,
            message: error.message,
            error_hash: ErrorCode.LOGS_GET_QUERY,
        })
    }

    const logs = (data ?? []) as LogEntry[]

    return { logs, isTruncated: logs.length >= LOGS_FETCH_LIMIT }
})
