'use client'

import { CopyIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
    LOG_LEVEL_DOT_CLASS,
    LOG_LEVEL_LABEL,
    LOG_LEVEL_TEXT_CLASS,
} from '@/modules/logs/logs.constants'
import { formatLogTimestamp, getLogErrorSummary } from '@/modules/logs/logs.helpers'
import { stringifyLog, stringifyMetadata } from '@/modules/logs/log-details.helpers'
import type { LogEntry } from '@/types/Log'

type Props = {
    log: LogEntry
    onClose?: () => void
}

type FieldProps = {
    label: string
    children: React.ReactNode
}

function Field({ label, children }: FieldProps) {
    return (
        <div className="grid grid-cols-[6rem_1fr] gap-3 border-b border-border/50 py-2 last:border-b-0">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="min-w-0 break-words">{children}</dd>
        </div>
    )
}

export function LogDetails({ log, onClose }: Props) {
    const { tag, hash } = getLogErrorSummary(log)
    const metadata = stringifyMetadata(log.metadata)

    const copyLog = () => {
        navigator.clipboard
            .writeText(stringifyLog(log))
            .then(() => toast.success('Log copied to clipboard'))
            .catch(() => toast.error('Could not copy the log'))
    }

    return (
        <div className="flex h-full min-h-0 flex-col w-full">
            <div className="flex items-center gap-2 border-b px-4 py-3">
                <span
                    className={cn('size-2 shrink-0 rounded-full', LOG_LEVEL_DOT_CLASS[log.level])}
                />
                <h2 className={cn('text-sm font-semibold', LOG_LEVEL_TEXT_CLASS[log.level])}>
                    {LOG_LEVEL_LABEL[log.level]}
                </h2>
                <span className="truncate font-mono text-xs text-muted-foreground">
                    {log.prefix}
                </span>
                <div className="ml-auto flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={copyLog}
                        aria-label="Copy log as JSON"
                        className="size-7 cursor-pointer"
                    >
                        <CopyIcon />
                    </Button>
                    {onClose && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            aria-label="Close details"
                            className="size-7 cursor-pointer"
                        >
                            <XIcon />
                        </Button>
                    )}
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
                <p className="mb-3 font-mono text-sm break-words">
                    {log.message ?? '(no message)'}
                </p>

                <dl className="font-mono text-xs">
                    <Field label="Time">{formatLogTimestamp(log.created_at)}</Field>
                    <Field label="Source">{log.prefix}</Field>
                    {tag && <Field label="Error">{tag}</Field>}
                    {hash && <Field label="Error hash">{hash}</Field>}
                    <Field label="User">{log.user_id ?? 'System'}</Field>
                    <Field label="Log ID">{log.id}</Field>
                </dl>

                <h3 className="mt-4 mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Metadata
                </h3>
                {metadata ? (
                    <pre className="overflow-x-auto border bg-muted/40 p-3 font-mono text-[0.7rem] leading-relaxed">
                        {metadata}
                    </pre>
                ) : (
                    <p className="text-xs text-muted-foreground">No metadata</p>
                )}
            </div>
        </div>
    )
}
