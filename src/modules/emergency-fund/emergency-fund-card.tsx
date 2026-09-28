import type { PropsWithChildren } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { MetricCard } from '@/components/ui/metric-card'
import { formatCurrency } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import type { BankBalanceSummary } from '@/types/BankConnection'
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

export function EmergencyFundCard({ summary, hidePrices }: Props) {
    const status = getEmergencyFundStatus(summary)
    const badge = STATUS_BADGE[status]
    const buttonLabel = CONNECT_BUTTON_LABEL[status]
    const daysLeft = getDaysUntil(summary.consentValidUntil)

    return (
        <MetricCard title="Emergency Fund" icon={ShieldCheck}>
            <BankConnectionToast />
            <div className="flex flex-row w-full justify-between items-center gap-2">
                {summary.balance === null ? (
                    <p className="text-sm text-muted-foreground">{EMPTY_BALANCE_MESSAGE[status]}</p>
                ) : (
                    <p
                        className={cn('text-2xl font-bold tabular-nums tracking-tight', {
                            'blur-md select-none': hidePrices,
                        })}
                    >
                        {formatCurrency(summary.balance, toDisplayCurrency(summary.currency))}
                    </p>
                )}
                <Badge variant={badge.variant}>{badge.label}</Badge>
            </div>
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
        </MetricCard>
    )
}
