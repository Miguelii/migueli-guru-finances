export const POSITION_SORT_KEYS = ['value', 'unrealized', 'total_gl', 'name'] as const

export type PositionSortKey = (typeof POSITION_SORT_KEYS)[number]

export const DEFAULT_POSITION_SORT: PositionSortKey = 'value'

export const ALL_POSITION_TYPES = 'all' as const
