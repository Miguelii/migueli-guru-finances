export enum LogLevel {
    Debug = 'debug',
    Info = 'info',
    Warn = 'warn',
    Error = 'error',
}

export type LogEntry = {
    id: string
    created_at: string
    level: LogLevel
    prefix: string
    message: string | null
    metadata: Record<string, unknown> | null
    user_id: string | null
}
