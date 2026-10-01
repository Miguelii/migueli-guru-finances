import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatPercentage, formatQuantity } from '@/lib/portfolio/formaters'
import { buildLogoUrl, cn } from '@/lib/utils'
import type { HoldingSummary } from '@/types/Holding'
import { Currency } from '@/types/Transaction'
import { PortfolioCard } from '@/modules/portfolio-card/portfolio-card'
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
    const { holding, apy, yearlyTokens, yearlyEur, monthlyEur } = item
    const blurClass = { 'blur-sm select-none': hidePrices }

    return (
        <li className="flex items-center gap-3 py-3">
            {holding.tickerLogo ? (
                <Image
                    src={buildLogoUrl(holding.tickerLogo)}
                    alt={`${holding.ticker_id} logo`}
                    width={28}
                    height={28}
                    className="size-7 shrink-0 rounded-none"
                    unoptimized
                />
            ) : (
                <span className="flex size-7 shrink-0 items-center justify-center bg-muted text-xs font-semibold text-muted-foreground">
                    {holding.ticker_id.slice(0, 2)}
                </span>
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="text-sm">
                    <span className="font-semibold">{holding.ticker_id}</span> earning{' '}
                    <span className={cn('font-semibold text-success tabular-nums', blurClass)}>
                        {formatCurrency(yearlyEur, Currency.EUR)}
                    </span>{' '}
                    per year
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                    <span className={cn(blurClass)}>
                        ≈ {formatQuantity(yearlyTokens)} {holding.ticker_id}
                    </span>{' '}
                    per year ·{' '}
                    <span className={cn(blurClass)}>
                        {formatCurrency(monthlyEur, Currency.EUR)}
                    </span>{' '}
                    per month
                </p>
            </div>
            <Badge variant="outline" className="shrink-0 tabular-nums">
                {formatPercentage(apy * 100)} APY
            </Badge>
        </li>
    )
}

export function StakingCard({ holdings, hidePrices }: Props) {
    const yields = getStakingYields(holdings, STAKING_APY)
    const totals = getStakingTotals(yields)

    return (
        <PortfolioCard
            cardId="staking"
            title="Crypto Staking"
            className="w-full min-w-0 lg:flex-1"
            openHeightClassName="h-full"
            contentClassName="flex flex-col gap-4 w-full"
            actions={
                yields.length > 0 && (
                    <span
                        className={cn('text-xs text-muted-foreground tabular-nums', {
                            'blur-sm select-none': hidePrices,
                        })}
                    >
                        {formatCurrency(totals.stakedEur, Currency.EUR)} staked
                    </span>
                )
            }
        >
            {yields.length === 0 ? (
                <p className="text-sm text-muted-foreground">No staked assets yet</p>
            ) : (
                <>
                    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Estimated rewards
                            </span>
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
                        </div>
                        <p className="text-xs text-muted-foreground tabular-nums">
                            <span className={cn({ 'blur-sm select-none': hidePrices })}>
                                {formatCurrency(totals.monthlyEur, Currency.EUR)}
                            </span>{' '}
                            per month
                        </p>
                    </div>

                    <ul className="flex flex-col divide-y border-t">
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
        </PortfolioCard>
    )
}
