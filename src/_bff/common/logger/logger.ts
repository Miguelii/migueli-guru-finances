import 'server-only'

import { after } from 'next/server'
import { createDBServerClient } from '@/_bff/common/db/db.utils'
import { DBTables } from '@/_bff/common/db/types'
import { ServerEnv } from '@/env/server'
import type { LogLevel } from '@/types/Log'

type Props = {
    level: `${LogLevel}`
    /** Source of the log (e.g. `trpc`, `syncBankBalance`), shown as the "Source" facet in /logs */
    prefix: string
    message?: string
    error?: unknown
    metadata?: Record<string, unknown>
    userId?: string
}

const STACK_LINES = 4

/**
 * Turns an error into a JSON-safe value for console output and the `logs.metadata` column.
 * Tagged errors keep their fields (`_tag`, `message`, `error_hash`) minus the fiber stack,
 * plain `Error`s keep name, message and a trimmed stack. Nested causes are serialized too.
 * @param error - Anything thrown or failed with (tagged error, `Error`, defects array, value).
 */
export function serializeError(error: unknown): unknown {
    if (error == null) return error

    if (Array.isArray(error)) return error.map((item) => serializeError(item))

    if (typeof error === 'object' && '_tag' in error) {
        const { stack: _stack, ...fields } = error as Record<string, unknown>
        const record = error as Record<string, unknown>

        return {
            ...fields,
            // `message` and `cause` are non-enumerable on Effect errors, so read them directly
            message:
                typeof record.message === 'string' && record.message ? record.message : undefined,
            cause: serializeError(record.cause),
        }
    }

    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message || String(error),
            cause: error.cause ? serializeError(error.cause) : undefined,
            stack: error.stack?.split('\n').slice(0, STACK_LINES).join('\n'),
        }
    }

    return error
}

export function Logger(props: Props): void {
    const { level, prefix, message, error, metadata, userId } = props

    const header = message ? `[${prefix}] ${message}` : `[${prefix}]`
    const details: Record<string, unknown> = { timestamp: new Date().toISOString() }

    if (userId !== undefined) details.userId = userId
    if (error !== undefined) details.error = serializeError(error)
    if (metadata !== undefined) details.metadata = metadata

    console[level](header, details)

    if (ServerEnv.NODE_ENV !== 'production') return

    const run = () =>
        persistLog(props).catch((persistError: unknown) => {
            console.error(
                '[Logger] persist failed',
                persistError instanceof Error ? persistError.message : persistError
            )
        })

    try {
        after(run)
    } catch {
        // Outside a Next.js request scope `after` throws: fire the insert directly
        void run()
    }
}

async function persistLog({ level, prefix, message, error, metadata, userId }: Props) {
    const supabaseClient = await createDBServerClient(true)

    const combinedMetadata: Record<string, unknown> = { ...metadata }
    if (error !== undefined) combinedMetadata.error = serializeError(error)

    const { error: insertError } = await supabaseClient.from(DBTables.LOGS).insert({
        level,
        prefix,
        message: message ?? null,
        metadata: Object.keys(combinedMetadata).length > 0 ? combinedMetadata : null,
        user_id: userId ?? null,
    })

    if (insertError) throw new Error(insertError.message)
}
