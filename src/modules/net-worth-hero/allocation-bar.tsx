import { ASSET_TYPE_META } from '@/lib/constants/asset-types'
import type { TypeBreakdownItem } from '@/lib/portfolio/calculations'
import { cn } from '@/lib/utils'

type Props = {
    breakdown: TypeBreakdownItem[]
}

export function AllocationBar({ breakdown }: Props) {
    if (breakdown.length === 0) return null

    return (
        <div className="flex flex-col gap-3">
            <div className="flex h-2 w-full gap-0.5 overflow-hidden bg-muted" aria-hidden="true">
                {breakdown.map((item) => (
                    <div
                        key={item.type}
                        className={cn('h-full', ASSET_TYPE_META[item.type].bgClassName)}
                        style={{ width: `${item.share}%` }}
                    />
                ))}
            </div>
            <ul className="flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Allocation by asset type">
                {breakdown.map((item) => (
                    <li key={item.type} className="flex items-center gap-1.5 text-xs">
                        <span
                            aria-hidden="true"
                            className={cn(
                                'size-2 shrink-0',
                                ASSET_TYPE_META[item.type].bgClassName
                            )}
                        />
                        <span className="text-muted-foreground">
                            {ASSET_TYPE_META[item.type].label}
                        </span>
                        <span className="font-medium tabular-nums">{item.share.toFixed(1)}%</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}
