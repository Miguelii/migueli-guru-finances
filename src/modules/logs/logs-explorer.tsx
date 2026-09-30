'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { LOG_RANGE_LABEL, type LogRange } from '@/lib/constants/logs'
import { LogDetails } from '@/modules/logs/log-details'
import { LogsFilters } from '@/modules/logs/logs-filters'
import { LogsHistogram } from '@/modules/logs/logs-histogram'
import { LogsTable } from '@/modules/logs/logs-table'
import { LogsToolbar } from '@/modules/logs/logs-toolbar'
import { useIsLargeScreen } from '@/modules/logs/use-is-large-screen'
import { useLogsExplorer } from '@/modules/logs/use-logs-explorer'
import type { LogEntry } from '@/types/Log'

type Props = {
    logs: LogEntry[]
    isTruncated: boolean
    range: LogRange
    fetchedAt: string
}

export function LogsExplorer({ logs, isTruncated, range, fetchedAt }: Props) {
    const [isFiltersOpen, setIsFiltersOpen] = useState(false)
    const isLargeScreen = useIsLargeScreen()

    const {
        levels,
        source,
        filteredLogs,
        levelFacets,
        sourceFacets,
        histogram,
        selectedLog,
        drawerLog,
        hasFilters,
        toggleLevel,
        toggleSource,
        clearFilters,
        selectLog,
        closeDetails,
    } = useLogsExplorer({ logs, range, fetchedAt })

    const filters = (
        <LogsFilters
            levels={levels}
            source={source}
            levelFacets={levelFacets}
            sourceFacets={sourceFacets}
            hasFilters={hasFilters}
            onToggleLevel={toggleLevel}
            onToggleSource={toggleSource}
            onClear={clearFilters}
        />
    )

    const emptyState = (
        <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
            <p className="text-sm font-medium">
                {logs.length === 0 ? 'No logs in this time range' : 'No logs match these filters'}
            </p>
            <p className="max-w-sm text-xs text-muted-foreground">
                {logs.length === 0
                    ? 'Try a wider range. Logs are only persisted in production.'
                    : 'Change or clear the level and source filters.'}
            </p>
            {logs.length > 0 && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="mt-2 cursor-pointer"
                >
                    Clear filters
                </Button>
            )}
        </div>
    )

    return (
        <section aria-label="Logs" className="flex min-w-0 flex-col gap-3">
            <LogsToolbar onOpenFilters={() => setIsFiltersOpen(true)} hasFilters={hasFilters} />

            <LogsHistogram buckets={histogram} range={range} />

            <p className="text-xs text-muted-foreground" aria-live="polite">
                {filteredLogs.length} of {logs.length} logs, {LOG_RANGE_LABEL[range].toLowerCase()}
                {isTruncated && ' (showing the most recent only, narrow the range or search)'}
            </p>

            <div className="flex min-w-0 items-start gap-3">
                <aside className="sticky top-4 hidden w-56 shrink-0 border bg-card p-3 lg:block">
                    {filters}
                </aside>

                <LogsTable
                    logs={filteredLogs}
                    selectedId={selectedLog?.id ?? null}
                    emptyState={emptyState}
                    onSelect={selectLog}
                />
            </div>

            <Sheet open={isFiltersOpen && !isLargeScreen} onOpenChange={setIsFiltersOpen}>
                <SheetContent side="left" className="p-4 pt-12">
                    <SheetTitle className="sr-only">Log filters</SheetTitle>
                    {filters}
                </SheetContent>
            </Sheet>

            <Sheet
                open={selectedLog !== null}
                onOpenChange={(open) => {
                    if (!open) closeDetails()
                }}
            >
                <SheetContent
                    side="right"
                    showCloseButton={false}
                    className="w-full gap-0 p-0 sm:max-w-lg"
                >
                    <SheetTitle className="sr-only">Log details</SheetTitle>
                    {drawerLog && <LogDetails log={drawerLog} onClose={closeDetails} />}
                </SheetContent>
            </Sheet>
        </section>
    )
}
