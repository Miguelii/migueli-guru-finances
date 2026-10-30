import type { PropsWithChildren } from 'react'
import { Target } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import type { BankBalanceSummary } from '@/types/BankConnection'
import { PortfolioCard } from '@/modules/portfolio-card/portfolio-card'
import { BankConnectionToast } from '@/modules/emergency-fund/bank-connection-toast'
import { ConnectBankButton } from '@/modules/emergency-fund/connect-bank-button'
import { FundAllocationBar } from '@/modules/emergency-fund/fund-allocation-bar'
import { FundBucketTile } from '@/modules/emergency-fund/fund-bucket-tile'
import {
    CONNECT_BUTTON_LABEL,
    EMPTY_BALANCE_MESSAGE,
    STATUS_BADGE,
    TOTAL_GOAL,
} from '@/modules/emergency-fund/emergency-fund-card.constants'
import {
    formatDateTime,
    formatDaysLeft,
    formatDueMonth,
    formatMonthsLeft,
    getDaysUntil,
    getEmergencyFundPlan,
    getEmergencyFundStatus,
    toDisplayCurrency,
} from '@/modules/emergency-fund/emergency-fund-card.helpers'

type Props = {
    summary: BankBalanceSummary
    hidePrices: boolean
}

type DetailRowProps = PropsWithChildren<{
    title: string
}>

const DetailRow = ({ title, children }: DetailRowProps) => (
    <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-xs font-medium tabular-nums">{children}</p>
    </div>
)

export function EmergencyFundCard({ summary, hidePrices }: Props) {
    const status = getEmergencyFundStatus(summary)
    const badge = STATUS_BADGE[status]
    const buttonLabel = CONNECT_BUTTON_LABEL[status]
    const daysLeft = getDaysUntil(summary.consentValidUntil)
    const currency = toDisplayCurrency(summary.currency)
    const plan = summary.balance === null ? null : getEmergencyFundPlan(summary.balance)

    return (
        <PortfolioCard
            cardId="emergency-fund"
            title="Emergency Fund"
            openHeightClassName="h-auto xl:h-full"
            actions={
                <>
                    {/* In the header so a connection needing attention is visible while collapsed */}
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    <div className="flex items-center gap-1 text-xs font-medium tabular-nums text-muted-foreground">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span>Target {formatCurrency(TOTAL_GOAL, currency, 0)}</span>
                    </div>
                </>
            }
            contentClassName="py-4 flex flex-col gap-4 w-full"
        >
            <BankConnectionToast />
            {summary.balance === null || plan === null ? (
                <p className="text-sm text-muted-foreground">{EMPTY_BALANCE_MESSAGE[status]}</p>
            ) : (
                <>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <p
                            className={cn('text-2xl font-semibold tabular-nums tracking-tight', {
                                'blur-md select-none': hidePrices,
                            })}
                        >
                            {formatCurrency(summary.balance, currency)}
                            <span className="text-sm font-normal text-muted-foreground">
                                {' '}
                                of {formatCurrency(TOTAL_GOAL, currency, 0)}
                            </span>
                        </p>
                        {plan.surplus > 0 && (
                            <p
                                className={cn('text-xs text-success tabular-nums', {
                                    'blur-md select-none': hidePrices,
                                })}
                            >
                                +{formatCurrency(plan.surplus, currency)} above target
                            </p>
                        )}
                    </div>
                    <FundAllocationBar
                        fund={plan.fund}
                        insurance={plan.insurance}
                        currency={currency}
                        hidePrices={hidePrices}
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                        <FundBucketTile
                            title="Emergency fund"
                            bucket={plan.fund}
                            currency={currency}
                            hidePrices={hidePrices}
                            actionLabel="Top up now"
                            actionValue={formatCurrency(plan.fund.missing, currency)}
                            completeLabel="Fund is full"
                        />
                        <FundBucketTile
                            title="Car insurance"
                            bucket={plan.insurance}
                            currency={currency}
                            hidePrices={hidePrices}
                            actionLabel="Save monthly"
                            actionValue={`${formatCurrency(plan.insurance.monthly, currency)} / month`}
                            caption={
                                plan.insurance.isDueThisMonth
                                    ? 'Due this month'
                                    : `${formatMonthsLeft(plan.insurance.monthsLeft)} until ${formatDueMonth(plan.insurance.dueDate)}`
                            }
                            completeLabel={`Covered for ${formatDueMonth(plan.insurance.dueDate)}`}
                        />
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2">
                        <p className="text-sm font-medium">This month</p>
                        {plan.thisMonthTotal > 0 ? (
                            <p
                                className={cn('text-sm font-semibold tabular-nums', {
                                    'blur-md select-none': hidePrices,
                                })}
                            >
                                {formatCurrency(plan.thisMonthTotal, currency)}
                            </p>
                        ) : (
                            <p className="text-sm text-success">Nothing to add</p>
                        )}
                    </div>
                </>
            )}
            <Separator />
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                <div className="flex flex-col gap-1">
                    {summary.balanceUpdatedAt && (
                        <DetailRow title="Updated">
                            {formatDateTime(summary.balanceUpdatedAt)}
                        </DetailRow>
                    )}
                    {summary.consentValidUntil && daysLeft !== null && daysLeft > 0 && (
                        <DetailRow title="Access expires in">{formatDaysLeft(daysLeft)}</DetailRow>
                    )}
                </div>
                {buttonLabel && <ConnectBankButton label={buttonLabel} />}
            </div>
        </PortfolioCard>
    )
}
