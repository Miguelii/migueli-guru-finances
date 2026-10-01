import { AssetLogo } from '@/components/ui/asset-logo'
import { formatQuantity } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import type { HoldingSummary } from '@/types/Holding'

type Props = {
    holding: HoldingSummary
    hidePrices: boolean
    showQuantity?: boolean
}

export function PositionAsset({ holding, hidePrices, showQuantity = true }: Props) {
    return (
        <span className="flex min-w-0 items-center gap-2.5">
            <AssetLogo logo={holding.tickerLogo} ticker={holding.symbol} />
            <span className="flex min-w-0 flex-col text-left">
                <span className="truncate font-semibold">{holding.symbol}</span>
                {showQuantity && (
                    <span
                        className={cn('truncate text-xs text-muted-foreground tabular-nums', {
                            'blur-sm select-none': hidePrices,
                        })}
                    >
                        Qty {formatQuantity(holding.total_quantity)}
                    </span>
                )}
            </span>
        </span>
    )
}
