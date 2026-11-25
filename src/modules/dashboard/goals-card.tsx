import { LifeBuoyIcon } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { getGoalProgress } from '@/components/goal-progress/goal-progress.helpers'
import { EMERGENCY_FUND_ROUTE_PATH, SETTINGS_ROUTE_PATH } from '@/lib/constants'
import { formatCurrency } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import type { BankBalanceSummary } from '@/types/BankConnection'
import { EMPTY_BALANCE_MESSAGE } from '@/modules/emergency-fund/emergency-fund-card.constants'
import {
    getEmergencyFundStatus,
    toDisplayCurrency,
} from '@/modules/emergency-fund/emergency-fund-card.helpers'
import { DashboardCardHeader } from '@/modules/dashboard/dashboard-card-header'

type Props = {
    bankBalance: BankBalanceSummary
    // `null` until it is set on the Settings page
    goal: number | null
    hidePrices: boolean
}

export function GoalsCard({ bankBalance, goal, hidePrices }: Props) {
    const currency = toDisplayCurrency(bankBalance.currency)
    const { balance } = bankBalance

    return (
        <Card aria-labelledby="goals-title" className="gap-4 p-5">
            <DashboardCardHeader
                id="goals-title"
                title="Goals"
                href={EMERGENCY_FUND_ROUTE_PATH}
                linkLabel="View"
            />
            <div className="flex items-start gap-3">
                <span
                    aria-hidden="true"
                    className="grid size-9 shrink-0 place-items-center rounded-lg bg-success/10 text-success"
                >
                    <LifeBuoyIcon className="size-4" />
                </span>
                {balance === null ? (
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <p className="text-sm font-medium">Emergency fund</p>
                        <p className="text-xs text-muted-foreground">
                            {EMPTY_BALANCE_MESSAGE[getEmergencyFundStatus(bankBalance)]}
                        </p>
                    </div>
                ) : goal === null ? (
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <p className="text-sm font-medium">Emergency fund</p>
                        <Link
                            href={SETTINGS_ROUTE_PATH}
                            className="text-xs font-medium text-brand underline-offset-4 hover:underline"
                        >
                            Set a goal in Settings
                        </Link>
                    </div>
                ) : (
                    <EmergencyFundProgress
                        balance={balance}
                        goal={goal}
                        currency={currency}
                        hidePrices={hidePrices}
                    />
                )}
            </div>
        </Card>
    )
}

type ProgressProps = {
    balance: number
    goal: number
    currency: ReturnType<typeof toDisplayCurrency>
    hidePrices: boolean
}

const EmergencyFundProgress = ({ balance, goal, currency, hidePrices }: ProgressProps) => {
    const { percentage } = getGoalProgress(balance, goal)

    return (
        <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="text-sm font-medium">Emergency fund</p>
                    <p
                        className={cn('text-xs text-muted-foreground tabular-nums', {
                            'blur-sm select-none': hidePrices,
                        })}
                    >
                        {formatCurrency(balance, currency, 0)} of{' '}
                        {formatCurrency(goal, currency, 0)}
                    </p>
                </div>
                <span className="text-sm font-semibold text-success tabular-nums">
                    {percentage.toFixed(1)}%
                </span>
            </div>
            <div
                className="h-1.5 overflow-hidden rounded-full bg-muted"
                role="meter"
                aria-label="Emergency fund goal progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(percentage)}
            >
                <div
                    className="h-full rounded-full bg-success"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    )
}
