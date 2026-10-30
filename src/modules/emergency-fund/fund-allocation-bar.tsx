import { getGoalProgress } from '@/components/goal-progress/goal-progress.helpers'
import { formatCurrency } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import type { Currency } from '@/types/core/Currency'
import type { FundBucket } from '@/modules/emergency-fund/emergency-fund-card.helpers'
import {
    FUND_SEGMENT_SHARE,
    INSURANCE_SEGMENT_SHARE,
} from '@/modules/emergency-fund/fund-allocation-bar.constants'

type Props = {
    fund: FundBucket
    insurance: FundBucket
    currency: Currency
    hidePrices: boolean
}

export function FundAllocationBar({ fund, insurance, currency, hidePrices }: Props) {
    const fundPercentage = getGoalProgress(fund.saved, fund.goal).percentage
    const insurancePercentage = getGoalProgress(insurance.saved, insurance.goal).percentage

    return (
        <div className="flex flex-col gap-2">
            <div
                role="img"
                aria-label={`Emergency fund ${fundPercentage.toFixed(0)}% full, car insurance ${insurancePercentage.toFixed(0)}% full`}
                className="flex h-2.5 w-full gap-0.5"
            >
                <div
                    className="h-full overflow-hidden rounded-l-full bg-muted"
                    style={{ flexBasis: `${FUND_SEGMENT_SHARE}%` }}
                >
                    <div
                        className={cn(
                            'h-full transition-[width] duration-500 ease-out motion-reduce:transition-none',
                            {
                                'bg-success': fund.isComplete,
                                'bg-foreground': !fund.isComplete,
                            }
                        )}
                        style={{ width: `${fundPercentage}%` }}
                    />
                </div>
                <div
                    className="h-full overflow-hidden rounded-r-full bg-muted"
                    style={{ flexBasis: `${INSURANCE_SEGMENT_SHARE}%` }}
                >
                    <div
                        className={cn(
                            'h-full transition-[width] duration-500 ease-out motion-reduce:transition-none',
                            {
                                'bg-success': insurance.isComplete,
                                'bg-chart-2': !insurance.isComplete,
                            }
                        )}
                        style={{ width: `${insurancePercentage}%` }}
                    />
                </div>
            </div>
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <span aria-hidden="true" className="size-2 rounded-full bg-foreground" />
                    <span>Emergency fund</span>
                    <span
                        className={cn('font-medium tabular-nums text-foreground', {
                            'blur-md select-none': hidePrices,
                        })}
                    >
                        {formatCurrency(fund.goal, currency, 0)}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span aria-hidden="true" className="size-2 rounded-full bg-chart-2" />
                    <span>Car insurance</span>
                    <span
                        className={cn('font-medium tabular-nums text-foreground', {
                            'blur-md select-none': hidePrices,
                        })}
                    >
                        {formatCurrency(insurance.goal, currency, 0)}
                    </span>
                </div>
            </div>
        </div>
    )
}
