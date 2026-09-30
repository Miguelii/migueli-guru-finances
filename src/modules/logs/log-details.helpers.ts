import type { LogEntry } from '@/types/Log'

export function stringifyLog(log: LogEntry): string {
    return JSON.stringify(log, null, 2)
}

export function stringifyMetadata(metadata: LogEntry['metadata']): string | null {
    return metadata ? JSON.stringify(metadata, null, 2) : null
}
