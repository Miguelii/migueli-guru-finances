'use client'

import { cn } from '@/lib/utils'
import { LOG_LEVEL_DOT_CLASS, LOG_LEVEL_LABEL } from '@/modules/logs/logs.constants'
import type { LogFacet } from '@/modules/logs/logs.helpers'
import type { LogLevel } from '@/types/Log'

type Props = {
    levels: LogLevel[]
    source: string | null
    levelFacets: LogFacet<LogLevel>[]
    sourceFacets: LogFacet<string>[]
    hasFilters: boolean
    onToggleLevel: (level: LogLevel) => void
    onToggleSource: (source: string) => void
    onClear: () => void
}

type FacetButtonProps = {
    isActive: boolean
    count: number
    onClick: () => void
    children: React.ReactNode
}

function FacetButton({ isActive, count, onClick, children }: FacetButtonProps) {
    return (
        <button
            type="button"
            aria-pressed={isActive}
            onClick={onClick}
            className={cn(
                'flex w-full cursor-pointer items-center gap-2 px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                {
                    'bg-accent font-medium text-foreground': isActive,
                    'text-muted-foreground': !isActive,
                }
            )}
        >
            {children}
            <span className="ml-auto font-mono tabular-nums">{count}</span>
        </button>
    )
}

export function LogsFilters({
    levels,
    source,
    levelFacets,
    sourceFacets,
    hasFilters,
    onToggleLevel,
    onToggleSource,
    onClear,
}: Props) {
    return (
        <div className="flex flex-col gap-5 text-sm">
            <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold tracking-wide uppercase">Filters</h2>
                {hasFilters && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="cursor-pointer text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                        Clear
                    </button>
                )}
            </div>

            <section aria-labelledby="logs-filter-level" className="flex flex-col gap-1">
                <h3 id="logs-filter-level" className="px-2 text-xs text-muted-foreground">
                    Level
                </h3>
                {levelFacets.map(({ value, count }) => (
                    <FacetButton
                        key={value}
                        isActive={levels.includes(value)}
                        count={count}
                        onClick={() => onToggleLevel(value)}
                    >
                        <span
                            className={cn(
                                'size-2 shrink-0 rounded-full',
                                LOG_LEVEL_DOT_CLASS[value]
                            )}
                        />
                        {LOG_LEVEL_LABEL[value]}
                    </FacetButton>
                ))}
            </section>

            <section aria-labelledby="logs-filter-source" className="flex flex-col gap-1">
                <h3 id="logs-filter-source" className="px-2 text-xs text-muted-foreground">
                    Source
                </h3>
                {sourceFacets.length === 0 && (
                    <p className="px-2 text-xs text-muted-foreground">No sources</p>
                )}
                {sourceFacets.map(({ value, count }) => (
                    <FacetButton
                        key={value}
                        isActive={source === value}
                        count={count}
                        onClick={() => onToggleSource(value)}
                    >
                        <span className="truncate font-mono">{value}</span>
                    </FacetButton>
                ))}
            </section>
        </div>
    )
}
