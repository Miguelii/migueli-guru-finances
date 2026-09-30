import type { ChartConfig } from '@/components/ui/chart'
import { LogLevel } from '@/types/Log'

// Most severe first: order of the level facet and of the stacked histogram series
export const LOG_LEVELS: LogLevel[] = [LogLevel.Error, LogLevel.Warn, LogLevel.Info, LogLevel.Debug]

export const LOG_LEVEL_LABEL: Record<LogLevel, string> = {
    [LogLevel.Error]: 'Error',
    [LogLevel.Warn]: 'Warning',
    [LogLevel.Info]: 'Info',
    [LogLevel.Debug]: 'Debug',
}

export const LOG_LEVEL_DOT_CLASS: Record<LogLevel, string> = {
    [LogLevel.Error]: 'bg-destructive',
    [LogLevel.Warn]: 'bg-warning',
    [LogLevel.Info]: 'bg-chart-2',
    [LogLevel.Debug]: 'bg-muted-foreground',
}

export const LOG_LEVEL_TEXT_CLASS: Record<LogLevel, string> = {
    [LogLevel.Error]: 'text-destructive',
    [LogLevel.Warn]: 'text-warning',
    [LogLevel.Info]: 'text-chart-2',
    [LogLevel.Debug]: 'text-muted-foreground',
}

export const LOGS_CHART_CONFIG = {
    [LogLevel.Error]: { label: 'Error', color: 'var(--color-destructive)' },
    [LogLevel.Warn]: { label: 'Warning', color: 'var(--color-warning)' },
    [LogLevel.Info]: { label: 'Info', color: 'var(--color-chart-2)' },
    [LogLevel.Debug]: { label: 'Debug', color: 'var(--color-muted-foreground)' },
} satisfies ChartConfig

export const LOGS_HISTOGRAM_BUCKETS = 40

export const LOGS_SEARCH_DEBOUNCE_MS = 400

export const LOGS_LOCALE = 'pt-PT'
