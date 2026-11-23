import { ArrowLeftRight, BarChart3, Bitcoin, TrendingUp, type LucideIcon } from 'lucide-react'
import { TickerType } from '@/types/core/TickerType'

type AssetTypeMeta = {
    label: string
    /** CSS color for SVG/inline consumers (recharts fills, dynamic widths) */
    color: string
    /** Tailwind background token class for the same color */
    bgClassName: string
    /** Tinted tile (soft background + colored icon) for the same color */
    softClassName: string
    icon: LucideIcon
}

export const ASSET_TYPE_META: Record<TickerType, AssetTypeMeta> = {
    [TickerType.Crypto]: {
        label: 'Crypto',
        color: 'var(--color-asset-crypto)',
        bgClassName: 'bg-asset-crypto',
        softClassName: 'bg-asset-crypto/10 text-asset-crypto',
        icon: Bitcoin,
    },
    [TickerType.Etf]: {
        label: 'ETFs',
        color: 'var(--color-asset-etf)',
        bgClassName: 'bg-asset-etf',
        softClassName: 'bg-asset-etf/10 text-asset-etf',
        icon: BarChart3,
    },
    [TickerType.Stock]: {
        label: 'Stocks',
        color: 'var(--color-asset-stock)',
        bgClassName: 'bg-asset-stock',
        softClassName: 'bg-asset-stock/10 text-asset-stock',
        icon: TrendingUp,
    },
    [TickerType.Cambio]: {
        label: 'FX',
        color: 'var(--color-asset-cambio)',
        bgClassName: 'bg-asset-cambio',
        softClassName: 'bg-asset-cambio/10 text-asset-cambio',
        icon: ArrowLeftRight,
    },
}

/** Chart color for assets without a `hex_color` */
export const FALLBACK_ASSET_COLOR = 'var(--color-muted-foreground)'

/** Asset classes shown as portfolio summary cards, in display order */
export const ASSET_CLASS_ORDER = [TickerType.Crypto, TickerType.Etf, TickerType.Stock] as const
