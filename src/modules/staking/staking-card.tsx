import { AssetLogo } from '@/components/ui/asset-logo'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { formatCurrency, formatPercentage, formatQuantity } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import type { HoldingSummary } from '@/types/Holding'
import { Currency } from '@/types/core/Currency'
import { DashboardCardHeader } from '@/modules/dashboard/dashboard-card-header'
import { STAKING_APY } from '@/modules/staking/staking-card.constants'
import {
    getStakingTotals,
    getStakingYields,
    type StakingYield,
} from '@/modules/staking/staking-card.helpers'

type Props = {
    holdings: HoldingSummary[]
    hidePrices: boolean
}

type StakingRowProps = {
    item: StakingYield
    hidePrices: boolean
}

const StakingRow = ({ item, hidePrices }: StakingRowProps) => {
    const { holding, apy, yearlyTokens, yearlyEur } = item
    const blurClass = { 'blur-sm select-none': hidePrices }

    return (
        <li className="flex items-center gap-3 py-2">
            <AssetLogo logo={holding.tickerLogo} ticker={holding.ticker_id} className="size-8" />
            <span className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium">{holding.ticker_id}</span>
                    <Badge variant="outline" className="h-4 px-1.5 text-[10px] tabular-nums">
                        {formatPercentage(apy * 100)}
                    </Badge>
                </span>
                <span className={cn('text-xs text-muted-foreground tabular-nums', blurClass)}>
                    ≈ {formatQuantity(yearlyTokens)} {holding.ticker_id} / year
                </span>
            </span>
            <span
                className={cn(
                    'shrink-0 text-sm font-semibold text-success tabular-nums',
                    blurClass
                )}
            >
                {formatCurrency(yearlyEur, Currency.EUR)}
            </span>
        </li>
    )
}

export function StakingCard({ holdings, hidePrices }: Props) {
    const yields = getStakingYields(holdings, STAKING_APY)
    const totals = getStakingTotals(yields)

    return (
        <Card aria-labelledby="staking-title" className="gap-3 p-5">
            <DashboardCardHeader
                id="staking-title"
                title="Staking"
                subtitle="Estimated rewards on your staked crypto"
            />
            {yields.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                    No staked assets yet
                </p>
            ) : (
                <>
                    <div className="flex flex-col gap-0.5">
                        <p className="text-2xl font-semibold tracking-tight tabular-nums">
                            <span
                                className={cn('text-success', {
                                    'blur-md select-none': hidePrices,
                                })}
                            >
                                {formatCurrency(totals.yearlyEur, Currency.EUR)}
                            </span>{' '}
                            <span className="text-sm font-normal text-muted-foreground">
                                per year
                            </span>
                        </p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                            <span className={cn({ 'blur-sm select-none': hidePrices })}>
                                {formatCurrency(totals.monthlyEur, Currency.EUR)}
                            </span>{' '}
                            per month on{' '}
                            <span className={cn({ 'blur-sm select-none': hidePrices })}>
                                {formatCurrency(totals.stakedEur, Currency.EUR)}
                            </span>{' '}
                            staked
                        </p>
                    </div>

                    <ul className="flex flex-col border-t pt-1">
                        {yields.map((item) => (
                            <StakingRow
                                key={item.holding.ticker_id}
                                item={item}
                                hidePrices={hidePrices}
                            />
                        ))}
                    </ul>
                </>
            )}
        </Card>
    )
}
