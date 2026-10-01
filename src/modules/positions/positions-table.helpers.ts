import type { PositionSortKey } from '@/lib/constants/positions'
import type { HoldingSummary } from '@/types/Holding'
import { SORTED_COLUMN } from '@/modules/positions/positions.constants'
import { getUnrealized } from '@/modules/positions/positions.helpers'

export type PositionsTableTotals = {
    currentValue: number
    totalInvested: number
    unrealized: number
    realized: number
    totalGl: number
}

/**
 * `aria-sort` for a table column: only the column ordered by the current sort key gets
 * a direction (`name` sorts ascending, every numeric key descending).
 * @param columnId - Column id from `POSITIONS_TABLE_COLUMNS`.
 * @param sortKey - Current sort key.
 */
export function getColumnAriaSort(
    columnId: string,
    sortKey: PositionSortKey
): 'ascending' | 'descending' | undefined {
    if (SORTED_COLUMN[sortKey] !== columnId) return undefined

    return sortKey === 'name' ? 'ascending' : 'descending'
}

/**
 * Footer totals of the visible rows, in EUR. Unrealized follows the fees toggle.
 * @param rows - Positions shown in the table.
 * @param includeFees - Whether unrealized G/L includes fees.
 */
export function getTableTotals(rows: HoldingSummary[], includeFees: boolean): PositionsTableTotals {
    return rows.reduce<PositionsTableTotals>(
        (totals, h) => ({
            currentValue: totals.currentValue + h.current_value_eur,
            totalInvested: totals.totalInvested + h.total_invested_eur,
            unrealized: totals.unrealized + getUnrealized(h, includeFees).value,
            realized: totals.realized + h.realized_gl_eur,
            totalGl: totals.totalGl + h.total_gl_eur,
        }),
        { currentValue: 0, totalInvested: 0, unrealized: 0, realized: 0, totalGl: 0 }
    )
}
