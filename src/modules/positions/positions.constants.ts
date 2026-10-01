import type { PositionSortKey } from '@/lib/constants/positions'

export const POSITION_SORT_LABEL: Record<PositionSortKey, string> = {
    value: 'Market value',
    unrealized: 'Unrealized %',
    total_gl: 'Total G/L',
    name: 'Name',
}

// Stable `aria-sort` target: which table column each sort key orders
export const SORTED_COLUMN: Record<PositionSortKey, 'asset' | 'value' | 'unrealized' | 'total_gl'> =
    {
        value: 'value',
        unrealized: 'unrealized',
        total_gl: 'total_gl',
        name: 'asset',
    }
