export enum LogLevel {
    Debug = 'debug',
    Info = 'info',
    Warn = 'warn',
    Error = 'error',
}

export type LogMetadataValue =
    | string
    | number
    | boolean
    | null
    | LogMetadataValue[]
    | LogMetadataObject

export type LogMetadataObject = { [key: string]: LogMetadataValue }

export type LogEntry = {
    id: string
    created_at: string
    level: LogLevel
    prefix: string
    message: string | null
    metadata: LogMetadataObject | null
    user_id: string | null
    /** App that wrote the row (the table is shared) */
    project: string
}
