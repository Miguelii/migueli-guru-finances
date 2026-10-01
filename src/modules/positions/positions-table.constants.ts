// Mirrors SORTED_COLUMN values, so the header can mark the sorted column with aria-sort
export const POSITIONS_TABLE_COLUMNS = [
    { id: 'asset', label: 'Asset', align: 'left' },
    { id: 'price', label: 'Price', align: 'right' },
    { id: 'value', label: 'Market value', align: 'right' },
    { id: 'invested', label: 'Invested', align: 'right' },
    { id: 'unrealized', label: 'Unrealized', align: 'right' },
    { id: 'realized', label: 'Realized', align: 'right' },
    { id: 'total_gl', label: 'Total G/L', align: 'right' },
] as const
