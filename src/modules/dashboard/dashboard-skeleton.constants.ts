import { PiggyBankIcon, TrendingUpIcon, WalletIcon } from 'lucide-react'

// KPI cards as rendered by `KpiCards`, minus the values
export const KPI_SKELETONS = [
    { title: 'Net worth', icon: WalletIcon, accentClassName: 'bg-brand/10 text-brand' },
    { title: 'Invested', icon: PiggyBankIcon, accentClassName: 'bg-success/10 text-success' },
    {
        title: 'Unrealized gain',
        icon: TrendingUpIcon,
        accentClassName: 'bg-success/10 text-success',
    },
] as const

export const ASSET_CLASS_STAT_LABELS = ['Invested', 'Unrealized', 'Realized'] as const

export const ALLOCATION_STAT_LABELS = ['Invested', 'Value', 'Gain'] as const

export const ALLOCATION_ROW_KEYS = ['allocation-1', 'allocation-2', 'allocation-3'] as const

export const RECENT_TRANSACTION_KEYS = [
    'recent-1',
    'recent-2',
    'recent-3',
    'recent-4',
    'recent-5',
] as const
