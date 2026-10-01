import { useMemo, useState } from 'react'
import { useQueryState } from 'nuqs'
import {
    paramsUrlKeys,
    positionsFeesParser,
    positionsIdParser,
    positionsSortParser,
    positionsTypeParser,
} from '@/lib/core/searchParams'
import type { PositionSortKey } from '@/lib/constants/positions'
import {
    filterPositionsByType,
    getAvailableTypes,
    sortPositions,
    splitPositions,
    type PositionTypeFilter,
} from '@/modules/positions/positions.helpers'
import type { HoldingSummary } from '@/types/Holding'

// Filtered on the client from props: shallow skips the server re-render the adapter default triggers
const CLIENT_ONLY = { shallow: true } as const

export function usePositionsExplorer(holdings: HoldingSummary[]) {
    const [type, setType] = useQueryState(
        paramsUrlKeys.positions_type!,
        positionsTypeParser.withOptions(CLIENT_ONLY)
    )
    const [sortKey, setSortKey] = useQueryState(
        paramsUrlKeys.positions_sort!,
        positionsSortParser.withOptions(CLIENT_ONLY)
    )
    const [includeFees, setIncludeFees] = useQueryState(
        paramsUrlKeys.positions_fees!,
        positionsFeesParser.withOptions(CLIENT_ONLY)
    )
    const [selectedId, setSelectedId] = useQueryState(
        paramsUrlKeys.positions_id!,
        positionsIdParser.withOptions(CLIENT_ONLY)
    )

    const { open, closed } = useMemo(() => splitPositions(holdings), [holdings])
    const availableTypes = useMemo(() => getAvailableTypes(open), [open])

    const rows = useMemo(
        () => sortPositions(filterPositionsByType(open, type), sortKey, includeFees),
        [open, type, sortKey, includeFees]
    )

    const openValueEur = useMemo(
        () => open.reduce((sum, h) => sum + h.current_value_eur, 0),
        [open]
    )

    const selected = holdings.find((h) => h.ticker_id === selectedId) ?? null

    // Keeps the last opened position while the drawer plays its closing animation
    const [drawerHolding, setDrawerHolding] = useState<HoldingSummary | null>(selected)
    if (selected && selected !== drawerHolding) setDrawerHolding(selected)

    return {
        type,
        sortKey,
        includeFees,
        rows,
        closed,
        availableTypes,
        openValueEur,
        selected,
        drawerHolding,
        changeType: (value: PositionTypeFilter) => void setType(value),
        changeSort: (value: PositionSortKey | null) => {
            if (value) void setSortKey(value)
        },
        toggleFees: () => void setIncludeFees((current) => !current),
        selectPosition: (id: string) => void setSelectedId(id),
        closeDetails: () => void setSelectedId(null),
    }
}
