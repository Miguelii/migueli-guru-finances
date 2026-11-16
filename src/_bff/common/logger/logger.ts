import 'server-only'

import { after } from 'next/server'
import { Predicate } from 'effect'
import { createDBServerClient } from '@/_bff/common/db/db.utils'
import { DBTables } from '@/_bff/common/db/types'
import { ServerEnv } from '@/env/server'
import type { LogLevel, LogMetadataObject, LogMetadataValue } from '@/types/Log'

type LoggableError = LogMetadataValue | Error | (LoggableError | undefined)[]

type LogDetails = {
    timestamp: string
    userId?: string
    error?: LogMetadataValue
    metadata?: Record<string, LogMetadataValue>
}

type Props = {
    level: `${LogLevel}`
    /** Source of the log (e.g. `trpc`, `syncBankBalance`), shown as the "Source" facet in /logs */
    prefix: string
    message?: string
    error?: LoggableError
    metadata?: Record<string, LogMetadataValue>
    userId?: string
}

const STACK_LINES = 4

function isLoggableError(value: unknown, seen = new WeakSet<object>()): value is LoggableError {
    if (
        Predicate.isError(value) ||
        Predicate.isString(value) ||
        Predicate.isNumber(value) ||
        Predicate.isBoolean(value) ||
        Predicate.isNull(value)
    )
        return true

    if (Array.isArray(value)) {
        if (seen.has(value)) return false
        seen.add(value)
        const valid = value.every((item) => isLoggableError(item, seen))
        seen.delete(value)
        return valid
    }

    if (!Predicate.isObject(value)) return false

    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) return false
    if (seen.has(value)) return false

    seen.add(value)
    const valid = Object.values(value).every((item) => isLoggableError(item, seen))
    seen.delete(value)
    return valid
}

/**
 * Turns an error into a JSON-safe value for console output and the `logs.metadata` column.
 * Tagged errors keep their fields (`_tag`, `message`, `error_hash`) minus the fiber stack,
 * plain `Error`s keep name, message and a trimmed stack. Nested causes are serialized too.
 * @param error - A validated error value, tagged error, `Error`, or defects array.
 */
export function serializeError(error: LoggableError | undefined): LogMetadataValue | undefined {
    if (error === undefined) return undefined
    if (Array.isArray(error)) {
        return error.map((item) => serializeError(item) ?? null)
    }
    if (!Predicate.isError(error)) return error

    const details: LogMetadataObject = {
        message: error.message || String(error),
    }

    if ('_tag' in error && Predicate.isString(error._tag)) details._tag = error._tag
    if ('error_hash' in error && Predicate.isString(error.error_hash)) {
        details.error_hash = error.error_hash
    }

    if (error.cause !== undefined) {
        details.cause = isLoggableError(error.cause)
            ? (serializeError(error.cause) ?? null)
            : String(error.cause)
    }

    if (!('_tag' in error)) {
        details.name = error.name
        if (error.stack) details.stack = error.stack.split('\n').slice(0, STACK_LINES).join('\n')
    }

    return details
}

export function Logger(props: Props): void {
    const { level, prefix, message, error, metadata, userId } = props

    const header = message ? `[${prefix}] ${message}` : `[${prefix}]`
    const details = {
        timestamp: new Date().toISOString(),
        userId,
        error: error === undefined ? undefined : (serializeError(error) ?? null),
        metadata,
    } satisfies LogDetails

    if (userId === undefined) delete details.userId
    if (error === undefined) delete details.error
    if (metadata === undefined) delete details.metadata

    console[level](header, details)

    if (ServerEnv.NODE_ENV !== 'production') return

    const run = () =>
        persistLog(props).catch((persistError) => {
            console.error(
                '[Logger] persist failed',
                Predicate.isError(persistError) ? persistError.message : String(persistError)
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

    const combinedMetadata = { ...metadata }
    if (error !== undefined) combinedMetadata.error = serializeError(error) ?? null

    const { error: insertError } = await supabaseClient.from(DBTables.LOGS).insert({
        level,
        prefix,
        message: message ?? null,
        metadata: Object.keys(combinedMetadata).length > 0 ? combinedMetadata : null,
        user_id: userId ?? null,
    })

    if (insertError) throw new Error(insertError.message)
}
