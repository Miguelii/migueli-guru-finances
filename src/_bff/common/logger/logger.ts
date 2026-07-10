type LogLevel = 'info' | 'warn' | 'error' | 'debug'
type Primitive = string | number | boolean | bigint | symbol | null | undefined

function serialize(data: unknown): Record<string, unknown> {
    const timestamp = new Date().toISOString()
    if (data instanceof Error) return { message: data.message, stack: data.stack, timestamp }
    if (typeof data === 'object' && data !== null)
        return { ...(data as Record<string, unknown>), timestamp }
    return { message: String(data as Primitive), timestamp }
}

function log(level: LogLevel, label: string, data?: unknown) {
    console[level](
        label,
        data !== undefined ? serialize(data) : { timestamp: new Date().toISOString() }
    )
}

export const Logger = {
    info: (label: string, data?: unknown) => log('info', label, data),
    warn: (label: string, data?: unknown) => log('warn', label, data),
    error: (label: string, data?: unknown) => log('error', label, data),
    debug: (label: string, data?: unknown) => log('debug', label, data),
}
