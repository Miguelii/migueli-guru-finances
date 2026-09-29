import type { PropsWithChildren } from 'react'
import { Target } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { GoalProgress } from '@/components/goal-progress/goal-progress'
import { formatCurrency } from '@/lib/portfolio/formaters'
import type { BankBalanceSummary } from '@/types/BankConnection'
import { PortfolioCard } from '@/modules/portfolio-card/portfolio-card'
import { BankConnectionToast } from '@/modules/emergency-fund/bank-connection-toast'
import { ConnectBankButton } from '@/modules/emergency-fund/connect-bank-button'
import {
    CONNECT_BUTTON_LABEL,
    DEFAULT_EMERGENCY_FUND_GOAL,
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
    goal?: number
}

type DetailRowProps = PropsWithChildren<{
    title: string
}>

const DetailRow = ({ title, children }: DetailRowProps) => (
    <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-xs font-medium tabular-nums">{children}</p>
    </div>
)

export function EmergencyFundCard({
    summary,
    hidePrices,
    goal = DEFAULT_EMERGENCY_FUND_GOAL,
}: Props) {
    const status = getEmergencyFundStatus(summary)
    const badge = STATUS_BADGE[status]
    const buttonLabel = CONNECT_BUTTON_LABEL[status]
    const daysLeft = getDaysUntil(summary.consentValidUntil)
    const currency = toDisplayCurrency(summary.currency)

    return (
        <PortfolioCard
            cardId="emergency-fund"
            title="Emergency Fund"
            openHeightClassName="h-full"
            actions={
                <>
                    {/* In the header so a connection needing attention is visible while collapsed */}
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    <div className="flex items-center gap-1 text-xs font-medium tabular-nums text-muted-foreground">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span>Target {formatCurrency(goal, currency)}</span>
                    </div>
                </>
            }
            contentClassName="space-y-4 py-4"
        >
            <BankConnectionToast />
            {summary.balance === null ? (
                <p className="text-sm text-muted-foreground">{EMPTY_BALANCE_MESSAGE[status]}</p>
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
