'use client'

import { cn } from '@/lib/utils'
import {
    LOG_LEVEL_DOT_CLASS,
    LOG_LEVEL_LABEL,
    LOG_LEVEL_TEXT_CLASS,
} from '@/modules/logs/logs.constants'
import { formatLogDate, formatLogTime } from '@/modules/logs/logs.helpers'
import { LOGS_TABLE_GRID_CLASS } from '@/modules/logs/logs-table.constants'
import { LogLevel, type LogEntry } from '@/types/Log'

type Props = {
    logs: LogEntry[]
    selectedId: string | null
    emptyState: React.ReactNode
    onSelect: (id: string) => void
}

export function LogsTable({ logs, selectedId, emptyState, onSelect }: Props) {
    return (
        <div className="min-w-0 flex-1 border bg-card">
            <div
                className={cn(
                    LOGS_TABLE_GRID_CLASS,
                    'gap-x-3 border-b bg-muted/50 px-3 py-2 text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase'
                )}
            >
                <span>Time</span>
                <span className="hidden md:block">Level</span>
                <span className="hidden md:block">Source</span>
                <span>Message</span>
            </div>

            {logs.length === 0 ? (
                emptyState
            ) : (
                <ul className="max-h-[65svh] overflow-y-auto font-mono text-xs">
                    {logs.map((log) => {
                        const isSelected = log.id === selectedId

                        return (
                            <li key={log.id}>
                                <button
                                    type="button"
                                    onClick={() => onSelect(log.id)}
                                    aria-current={isSelected}
                                    className={cn(
                                        LOGS_TABLE_GRID_CLASS,
                                        'relative w-full cursor-pointer items-center gap-x-3 border-b border-border/50 px-3 py-1.5 text-left transition-colors hover:bg-accent/60 focus-visible:bg-accent focus-visible:outline-none',
                                        {
                                            'bg-accent': isSelected,
                                            'bg-destructive/5':
                                                log.level === LogLevel.Error && !isSelected,
                                        }
                                    )}
                                >
                                    <span
                                        aria-hidden
                                        className={cn(
                                            'absolute inset-y-0 left-0 w-0.5',
                                            LOG_LEVEL_DOT_CLASS[log.level]
                                        )}
                                    />
                                    <span className="flex flex-col text-muted-foreground tabular-nums md:flex-row md:gap-2">
                                        <span className="hidden text-muted-foreground/70 md:inline">
                                            {formatLogDate(log.created_at)}
                                        </span>
                                        {formatLogTime(log.created_at)}
                                    </span>
                                    <span
                                        className={cn(
                                            'hidden font-medium md:block',
                                            LOG_LEVEL_TEXT_CLASS[log.level]
                                        )}
                                    >
                                        {LOG_LEVEL_LABEL[log.level]}
                                    </span>
                                    <span className="hidden truncate md:block">{log.prefix}</span>
                                    <span className="flex min-w-0 flex-col md:block">
                                        <span className="block truncate text-muted-foreground md:hidden">
                                            {log.prefix}
                                        </span>
                                        <span className="block truncate">
                                            {log.message ?? '(no message)'}
                                        </span>
                                    </span>
                                </button>
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}
