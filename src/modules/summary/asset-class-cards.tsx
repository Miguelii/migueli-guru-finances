import type { HoldingSummary } from '@/types/Holding'
import { ASSET_CLASS_ORDER } from '@/lib/constants/asset-types'
import { computeTypeBreakdown } from '@/lib/portfolio/calculations'
import { AssetClassCard } from '@/modules/summary/asset-class-card'

type Props = {
    holdings: HoldingSummary[]
    hidePrices: boolean
}

export function AssetClassCards({ holdings, hidePrices }: Props) {
    const breakdown = computeTypeBreakdown(holdings)

    return (
        <section
            aria-label="Asset classes"
            className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6"
        >
            {ASSET_CLASS_ORDER.map((type) => (
                <AssetClassCard
                    key={type}
                    type={type}
                    item={breakdown.find((item) => item.type === type)}
                    hidePrices={hidePrices}
                />
            ))}
        </section>
    )
}
