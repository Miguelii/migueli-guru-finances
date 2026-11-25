import type { PropsWithChildren } from 'react'
import Link from 'next/link'
import { Target } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { GoalProgress } from '@/components/goal-progress/goal-progress'
import { SETTINGS_ROUTE_PATH } from '@/lib/constants'
import { formatCurrency } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import type { BankBalanceSummary } from '@/types/BankConnection'
import { PortfolioCard } from '@/modules/portfolio-card/portfolio-card'
import { BankConnectionToast } from '@/modules/emergency-fund/bank-connection-toast'
import { ConnectBankButton } from '@/modules/emergency-fund/connect-bank-button'
import {
    CONNECT_BUTTON_LABEL,
    EMPTY_BALANCE_MESSAGE,
    STATUS_BADGE,
} from '@/modules/emergency-fund/emergency-fund-card.constants'
import {
    formatDateTime,
    formatDaysLeft,
    getDaysUntil,
    getEmergencyFundStatus,
    toDisplayCurrency,
} from '@/modules/emergency-fund/emergency-fund-card.helpers'

type Props = {
    summary: BankBalanceSummary
    hidePrices: boolean
    // `null` until it is set on the Settings page
    goal: number | null
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

export function EmergencyFundCard({ summary, hidePrices, goal }: Props) {
    const status = getEmergencyFundStatus(summary)
    const badge = STATUS_BADGE[status]
    const buttonLabel = CONNECT_BUTTON_LABEL[status]
    const daysLeft = getDaysUntil(summary.consentValidUntil)
    const currency = toDisplayCurrency(summary.currency)

    return (
        <PortfolioCard
            cardId="emergency-fund"
            title="Emergency Fund"
            openHeightClassName="h-auto xl:h-full"
            actions={
                <>
                    {/* In the header so a connection needing attention is visible while collapsed */}
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    {goal !== null && (
                        <div className="flex items-center gap-1 text-xs font-medium tabular-nums text-muted-foreground">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <span>Target {formatCurrency(goal, currency)}</span>
                        </div>
                    )}
                </>
            }
            contentClassName="py-4 flex flex-row justify-between w-full"
        >
            <BankConnectionToast />
            {summary.balance === null ? (
                <p className="text-sm text-muted-foreground">{EMPTY_BALANCE_MESSAGE[status]}</p>
            ) : goal === null ? (
                <div className="flex min-w-0 flex-col gap-1">
                    <p className="text-xs text-muted-foreground">Bank balance</p>
                    <p
                        className={cn('text-xl font-semibold tracking-tight tabular-nums', {
                            'blur-md select-none': hidePrices,
                        })}
                    >
                        {formatCurrency(summary.balance, currency)}
                    </p>
                    <Link
                        href={SETTINGS_ROUTE_PATH}
                        className="text-xs font-medium text-brand underline-offset-4 hover:underline"
                    >
                        Set a goal in Settings
                    </Link>
                </div>
            ) : (
                <GoalProgress
                    label="Bank balance"
                    currentValue={summary.balance}
                    goal={goal}
                    currency={currency}
                    hidePrices={hidePrices}
                />
            )}
            <div className="flex flex-col gap-2">
                {summary.balanceUpdatedAt && (
                    <DetailRow title="Updated">
                        {formatDateTime(summary.balanceUpdatedAt)}
                    </DetailRow>
                )}
                {summary.consentValidUntil && daysLeft !== null && daysLeft > 0 && (
                    <DetailRow title="Access expires in">{formatDaysLeft(daysLeft)}</DetailRow>
                )}
                {buttonLabel && <ConnectBankButton label={buttonLabel} />}
            </div>
        </PortfolioCard>
    )
}
