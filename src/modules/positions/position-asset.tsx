import Image from 'next/image'
import { formatQuantity } from '@/lib/portfolio/formaters'
import { buildLogoUrl, cn } from '@/lib/utils'
import type { HoldingSummary } from '@/types/Holding'

type Props = {
    holding: HoldingSummary
    hidePrices: boolean
    showQuantity?: boolean
}

export function PositionAsset({ holding, hidePrices, showQuantity = true }: Props) {
    return (
        <span className="flex min-w-0 items-center gap-2.5">
            {holding.tickerLogo ? (
                <Image
                    src={buildLogoUrl(holding.tickerLogo)}
                    alt=""
                    width={28}
                    height={28}
                    className="size-7 shrink-0 rounded-none"
                    unoptimized
                />
            ) : (
                <span
                    aria-hidden="true"
                    className="flex size-7 shrink-0 items-center justify-center bg-muted text-xs font-semibold text-muted-foreground"
                >
                    {holding.symbol.slice(0, 2)}
                </span>
            )}
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
