import { AssetLogo } from '@/components/ui/asset-logo'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatPercentage, formatQuantity } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import { Currency } from '@/types/core/Currency'
import {
    DRIFT_STATUS_CLASS,
    DRIFT_STATUS_LABEL,
} from '@/modules/etf-planning/etf-planning-card.constants'
import {
    formatDrift,
    getDriftStatus,
    isSuggestedBuy,
    toUnits,
    type EtfPlanRow,
} from '@/modules/etf-planning/etf-planning-card.helpers'

type Props = {
    row: EtfPlanRow
    targetInput: string
    showContribution: boolean
    hidePrices: boolean
    onTargetChange: (tickerId: string, value: string) => void
}

export function EtfPlanningRow({
    row,
    targetInput,
    showContribution,
    hidePrices,
    onTargetChange,
}: Props) {
    const { holding } = row
    const status = getDriftStatus(row.driftPct)
    const blurClass = { 'blur-sm select-none': hidePrices }
    const inputId = `etf-target-${holding.ticker_id}`
    const hasBalanceBuy = isSuggestedBuy(row.buyToBalanceEur)
    const hasContributionBuy = showContribution && isSuggestedBuy(row.buyWithContributionEur)

    return (
        <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 py-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(9rem,auto)]">
            <div className="flex min-w-0 items-center gap-3">
                <AssetLogo logo={holding.tickerLogo} ticker={holding.ticker_id} />
                <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">{holding.ticker_id}</span>
                        {!row.isHeld && <Badge variant="secondary">Not held yet</Badge>}
                    </span>
                    {row.isHeld && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                            <span className={cn(blurClass)}>
                                {formatCurrency(row.currentEur, Currency.EUR)}
                            </span>{' '}
                            · {formatPercentage(row.currentPct)}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <label htmlFor={inputId} className="sr-only">
                    Target % for {holding.ticker_id}
                </label>
                <div className="relative">
                    <Input
                        id={inputId}
                        inputMode="decimal"
                        value={targetInput}
                        onChange={(event) => onTargetChange(holding.ticker_id, event.target.value)}
                        className="w-18 pr-6 text-right tabular-nums"
                    />
                    <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs text-muted-foreground">
                        %
                    </span>
                </div>
                <Badge
                    variant="outline"
                    className={cn('w-20 tabular-nums', DRIFT_STATUS_CLASS[status])}
                    title={DRIFT_STATUS_LABEL[status]}
                >
                    {formatDrift(row.driftPct)}
                </Badge>
            </div>

            <div className="col-span-2 flex flex-col text-xs tabular-nums sm:col-span-1 sm:items-end">
                {hasBalanceBuy ? (
                    <span>
                        Buy{' '}
                        <span className={cn('font-semibold', blurClass)}>
                            {formatCurrency(row.buyToBalanceEur, Currency.EUR)}
                        </span>
                    </span>
                ) : (
                    <span className="text-muted-foreground">No buy needed</span>
                )}
                {hasContributionBuy && (
                    <span className="text-muted-foreground">
                        From your investment:{' '}
                        <span className={cn('font-medium text-foreground', blurClass)}>
                            {formatCurrency(row.buyWithContributionEur, Currency.EUR)}
                        </span>{' '}
                        <span className={cn(blurClass)}>
                            (≈{' '}
                            {formatQuantity(
                                toUnits(row.buyWithContributionEur, row.unitPriceEur),
                                2
                            )}
                            )
                        </span>
                    </span>
                )}
            </div>
        </li>
    )
}
