import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { debounce, parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs'
import { paramsUrlKeys } from '@/lib/core/searchParams'
import { DEFAULT_LOG_RANGE, LOG_RANGES, type LogRange } from '@/lib/constants/logs'
import { LOGS_SEARCH_DEBOUNCE_MS } from '@/modules/logs/logs.constants'

export function useLogsToolbar() {
    const router = useRouter()
    const [isRefreshing, startRefresh] = useTransition()

    // Range and search refetch on the server (non-shallow), search debounced while typing
    const [range, setRange] = useQueryState(
        paramsUrlKeys.logs_range!,
        parseAsStringLiteral(LOG_RANGES).withDefault(DEFAULT_LOG_RANGE)
    )
    const [search, setSearch] = useQueryState(
        paramsUrlKeys.logs_search!,
        parseAsString.withDefault('').withOptions({
            limitUrlUpdates: debounce(LOGS_SEARCH_DEBOUNCE_MS),
        })
    )

    const refresh = () => startRefresh(() => router.refresh())

    const changeRange = (value: LogRange | null) => {
        if (value) void setRange(value)
    }

    const changeSearch = (value: string) => {
        void setSearch(value || null)
    }

    return {
        range,
        search,
        isRefreshing,
        refresh,
        changeRange,
        changeSearch,
    }
}
