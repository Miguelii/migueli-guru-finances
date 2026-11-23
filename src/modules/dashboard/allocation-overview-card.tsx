import { Card } from '@/components/ui/card'
import { AssetLogo } from '@/components/ui/asset-logo'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getDeltaTone } from '@/components/ui/delta-badge.helpers'
import { ASSET_TYPE_META } from '@/lib/constants/asset-types'
import { POSITIONS_ROUTE_PATH } from '@/lib/constants'
import type { PortfolioTotals } from '@/lib/portfolio/calculations'
import { formatCurrency } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import { Currency } from '@/types/core/Currency'
import type { HoldingSummary } from '@/types/Holding'
import { AllocationRow } from '@/modules/dashboard/allocation-row'
import { DashboardCardHeader } from '@/modules/dashboard/dashboard-card-header'
import {
    ALLOCATION_ASSET_ROWS,
    AllocationView,
} from '@/modules/dashboard/allocation-overview-card.constants'
import {
    buildAssetAllocationRows,
    buildTypeAllocationRows,
} from '@/modules/dashboard/allocation-overview-card.helpers'

type Props = {
    holdings: HoldingSummary[]
    totals: PortfolioTotals
    hidePrices: boolean
}

type StatProps = {
    title: string
    value: number
    hidePrices: boolean
    isSigned?: boolean
}

const Stat = ({ title, value, hidePrices, isSigned = false }: StatProps) => {
    const tone = getDeltaTone(value)

    return (
        <div className="flex min-w-0 flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">{title}</dt>
            <dd
                className={cn(
                    'text-sm font-semibold whitespace-nowrap tabular-nums @[22rem]:text-base',
                    {
                        'text-success': isSigned && tone === 'positive',
                        'text-destructive': isSigned && tone === 'negative',
                        'blur-sm select-none': hidePrices,
                    }
                )}
            >
                {formatCurrency(value, Currency.EUR, 0)}
            </dd>
        </div>
    )
}

export function AllocationOverviewCard({ holdings, totals, hidePrices }: Props) {
    const typeRows = buildTypeAllocationRows(holdings)
    const assetRows = buildAssetAllocationRows(holdings, ALLOCATION_ASSET_ROWS)
    const openPositions = holdings.filter((h) => h.current_value_eur > 0).length
    const largest = typeRows.at(0)

    return (
        <Card aria-labelledby="allocation-title" className="@container gap-5 p-5">
            <DashboardCardHeader
                id="allocation-title"
                title="Allocation"
                href={POSITIONS_ROUTE_PATH}
                linkLabel="View positions"
            />

            <dl className="flex flex-wrap justify-between gap-x-6 gap-y-3">
                <Stat title="Invested" value={totals.totalInvested} hidePrices={hidePrices} />
                <Stat title="Value" value={totals.currentValue} hidePrices={hidePrices} />
                <Stat title="Gain" value={totals.unrealizedGl} hidePrices={hidePrices} isSigned />
            </dl>

            <div className="flex flex-col gap-2">
                <div
                    className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-muted"
                    aria-hidden="true"
                >
                    {typeRows.map((row) => (
                        <div
                            key={row.type}
                            className={cn(
                                'h-full first:rounded-l-full last:rounded-r-full',
                                ASSET_TYPE_META[row.type].bgClassName
                            )}
                            style={{ width: `${row.share}%` }}
                        />
                    ))}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="tabular-nums">
                        {largest
                            ? `${largest.share.toFixed(1)}% in ${ASSET_TYPE_META[largest.type].label}`
                            : 'No open positions'}
                    </span>
                    <span className="tabular-nums">{openPositions} open positions</span>
                </div>
            </div>

            <Tabs defaultValue={AllocationView.Type} className="gap-4">
                <TabsList className="h-8 w-full">
                    <TabsTrigger
                        value={AllocationView.Type}
                        className="cursor-pointer border-transparent text-xs"
                    >
                        By type
                    </TabsTrigger>
                    <TabsTrigger
                        value={AllocationView.Asset}
                        className="cursor-pointer border-transparent text-xs"
                    >
                        By asset
                    </TabsTrigger>
                </TabsList>
                <TabsContent value={AllocationView.Type}>
                    <ul className="flex flex-col gap-4">
                        {typeRows.map((row) => {
                            const meta = ASSET_TYPE_META[row.type]
                            const Icon = meta.icon

                            return (
                                <AllocationRow
                                    key={row.type}
                                    label={meta.label}
                                    icon={
                                        <span
                                            aria-hidden="true"
                                            className={cn(
                                                'grid size-9 shrink-0 place-items-center rounded-lg',
                                                meta.softClassName
                                            )}
                                        >
                                            <Icon className="size-4" />
                                        </span>
                                    }
                                    valueEur={row.valueEur}
                                    share={row.share}
                                    unrealizedGlPct={row.unrealizedGlPct}
                                    barClassName={meta.bgClassName}
                                    hidePrices={hidePrices}
                                />
                            )
                        })}
                    </ul>
                </TabsContent>
                <TabsContent value={AllocationView.Asset}>
                    <ul className="flex flex-col gap-4">
                        {assetRows.map((row) => (
                            <AllocationRow
                                key={row.id}
                                label={row.label}
                                icon={
                                    <AssetLogo
                                        logo={row.logo}
                                        ticker={row.label}
                                        className="size-9"
                                    />
                                }
                                valueEur={row.valueEur}
                                share={row.share}
                                unrealizedGlPct={row.unrealizedGlPct}
                                barColor={row.color}
                                hidePrices={hidePrices}
                            />
                        ))}
                    </ul>
                </TabsContent>
            </Tabs>
        </Card>
    )
}
