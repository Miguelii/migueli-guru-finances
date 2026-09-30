import { useMemo, useState } from 'react'
import { useQueryState } from 'nuqs'
import {
    logsIdParser,
    logsLevelParser,
    logsSourceParser,
    paramsUrlKeys,
} from '@/lib/core/searchParams'
import type { LogRange } from '@/lib/constants/logs'
import {
    buildHistogramBuckets,
    countLevelFacets,
    countSourceFacets,
    filterLogs,
} from '@/modules/logs/logs.helpers'
import type { LogEntry, LogLevel } from '@/types/Log'

type Props = {
    logs: LogEntry[]
    range: LogRange
    fetchedAt: string
}

// Filtered on the client from props: shallow skips the server re-render the adapter default triggers
const CLIENT_ONLY = { shallow: true } as const

export function useLogsExplorer({ logs, range, fetchedAt }: Props) {
    const [levels, setLevels] = useQueryState(
        paramsUrlKeys.logs_level!,
        logsLevelParser.withDefault([]).withOptions(CLIENT_ONLY)
    )
    const [source, setSource] = useQueryState(
        paramsUrlKeys.logs_source!,
        logsSourceParser.withOptions(CLIENT_ONLY)
    )
    const [selectedId, setSelectedId] = useQueryState(
        paramsUrlKeys.logs_id!,
        logsIdParser.withOptions(CLIENT_ONLY)
    )

    const filteredLogs = useMemo(() => filterLogs(logs, { levels, source }), [logs, levels, source])

    // Facets count within the other active filter, like Vercel: levels ignore the level filter
    const levelFacets = useMemo(
        () => countLevelFacets(filterLogs(logs, { levels: [], source })),
        [logs, source]
    )
    const sourceFacets = useMemo(
        () => countSourceFacets(filterLogs(logs, { levels, source: null })),
        [logs, levels]
    )

    const histogram = useMemo(
        () => buildHistogramBuckets(filteredLogs, range, new Date(fetchedAt).getTime()),
        [filteredLogs, range, fetchedAt]
    )

    const selectedLog = logs.find((log) => log.id === selectedId) ?? null

    const hasFilters = levels.length > 0 || source !== null

    // Keeps the last opened log while the drawer plays its closing animation
    const [drawerLog, setDrawerLog] = useState<LogEntry | null>(selectedLog)
    if (selectedLog && selectedLog !== drawerLog) setDrawerLog(selectedLog)

    const toggleLevel = (level: LogLevel) => {
        void setLevels((current) => {
            const next = current.includes(level)
                ? current.filter((value) => value !== level)
                : [...current, level]
            return next.length > 0 ? next : null
        })
    }

    const toggleSource = (value: string) => {
        void setSource((current) => (current === value ? null : value))
    }

    const clearFilters = () => {
        void setLevels(null)
        void setSource(null)
    }

    const selectLog = (id: string) => {
        void setSelectedId((current) => (current === id ? null : id))
    }

    const closeDetails = () => {
        void setSelectedId(null)
    }

    return {
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
    }
}
