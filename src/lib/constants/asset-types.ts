import { ArrowLeftRight, BarChart3, Bitcoin, TrendingUp, type LucideIcon } from 'lucide-react'
import { TickerType } from '@/types/Transaction'

type AssetTypeMeta = {
    label: string
    /** CSS color for SVG/inline consumers (recharts fills, dynamic widths) */
    color: string
    /** Tailwind background token class for the same color */
    bgClassName: string
    icon: LucideIcon
}

export const ASSET_TYPE_META: Record<TickerType, AssetTypeMeta> = {
    [TickerType.Crypto]: {
        label: 'Crypto',
        color: 'var(--color-asset-crypto)',
        bgClassName: 'bg-asset-crypto',
        icon: Bitcoin,
    },
    [TickerType.Etf]: {
        label: 'ETFs',
        color: 'var(--color-asset-etf)',
        bgClassName: 'bg-asset-etf',
        icon: BarChart3,
    },
    [TickerType.Stock]: {
        label: 'Stocks',
        color: 'var(--color-asset-stock)',
        bgClassName: 'bg-asset-stock',
        icon: TrendingUp,
    },
    [TickerType.Cambio]: {
        label: 'FX',
        color: 'var(--color-asset-cambio)',
        bgClassName: 'bg-asset-cambio',
        icon: ArrowLeftRight,
    },
}

/** Asset classes shown as portfolio summary cards, in display order */
export const ASSET_CLASS_ORDER = [TickerType.Crypto, TickerType.Etf, TickerType.Stock] as const
