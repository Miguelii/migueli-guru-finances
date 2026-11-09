import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { formatCurrency, formatMonthTick } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import { Currency } from '@/types/core/Currency'
import {
    HEALTHY_PAYMENT_EUR,
    HOUSE_STATUSES,
    PAYMENT_BAR_CLASS_NAMES,
} from '@/modules/planning/house-planner-card.constants'
import {
    formatEffortRate,
    formatEstimateEur,
    formatPaymentEur,
    formatTimeToSave,
    getGaugePct,
    getPaymentNote,
    getPaymentTone,
    getStarAmountLabel,
    type HousePlan,
    type HouseStar,
} from '@/modules/planning/house-planner-card.helpers'
import { StarMark } from '@/modules/planning/star-mark'

type Props = {
    plan: HousePlan
    gaugeMaxEur: number
    netSalaryEur: number
    hidePrices: boolean
}

type StarRowProps = {
    star: HouseStar
    priceEur: number
    gaugeMaxEur: number
    netSalaryEur: number
    showLimitLabel: boolean
    hidePrices: boolean
}

const StarRow = ({
    star,
    priceEur,
    gaugeMaxEur,
    netSalaryEur,
    showLimitLabel,
    hidePrices,
}: StarRowProps) => {
    const limitPct = getGaugePct(HEALTHY_PAYMENT_EUR.max, gaugeMaxEur)
    const limitLabel = `${formatPaymentEur(HEALTHY_PAYMENT_EUR.max)} limit`

    return (
        <li className="grid gap-3 p-5 md:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_7rem] md:items-center md:gap-6 lg:px-6">
            <div className="flex items-start gap-3">
                <StarMark
                    isEarned={star.isEarned}
                    className={cn('mt-0.5 size-5', { 'blur-sm': hidePrices })}
                />
                <div className="flex min-w-0 flex-col gap-0.5">
                    <h4 className="font-semibold">{star.label}</h4>
                    <p className="text-xs text-muted-foreground tabular-nums">
                        {getStarAmountLabel(star, priceEur)}
                    </p>
                </div>
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
                <p className="flex flex-wrap items-baseline justify-between gap-x-3 tabular-nums">
                    <span className="flex flex-wrap items-baseline gap-x-3">
                        <span className="text-xl font-semibold tracking-tight">
                            {formatPaymentEur(star.monthlyPaymentEur)}
                            <span className="text-xs font-normal text-muted-foreground">
                                {' '}
                                / month
                            </span>
                        </span>
                        <span
                            className={cn('text-xs font-medium', {
                                'blur-sm select-none': hidePrices,
                            })}
                        >
                            {formatEffortRate(star.monthlyPaymentEur, netSalaryEur)} effort rate
                        </span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {getPaymentNote(star.monthlyPaymentEur)}
                    </span>
                </p>
                <div aria-hidden="true" className="relative h-2.5 bg-foreground/10">
                    <div
                        className={cn(
                            'h-full',
                            PAYMENT_BAR_CLASS_NAMES[getPaymentTone(star.monthlyPaymentEur)]
                        )}
                        style={{ width: `${getGaugePct(star.monthlyPaymentEur, gaugeMaxEur)}%` }}
                    />
                    <span
                        className="absolute -inset-y-1 w-0.5 bg-foreground"
                        style={{ left: `${limitPct}%` }}
                    />
                </div>
                {showLimitLabel && (
                    <div aria-hidden="true" className="relative h-4">
                        <span
                            className="absolute -translate-x-1/2 text-xs whitespace-nowrap text-muted-foreground tabular-nums"
                            style={{ left: `${limitPct}%` }}
                        >
                            {limitLabel}
                        </span>
                    </div>
                )}
            </div>

            <div
                className={cn(
                    'flex items-baseline gap-2 tabular-nums md:flex-col md:items-end md:gap-0.5',
                    {
                        'blur-sm select-none': hidePrices,
                    }
                )}
            >
                {star.isEarned ? (
                    <p className="font-medium text-success">Earned</p>
                ) : (
                    <>
                        <p className="font-medium">{formatTimeToSave(star.monthsToSave)}</p>
                        {star.reachMonth && (
                            <p className="text-xs text-muted-foreground">
                                {formatMonthTick(star.reachMonth)}
                            </p>
                        )}
                    </>
                )}
            </div>
        </li>
    )
}

export function HouseDetail({ plan, gaugeMaxEur, netSalaryEur, hidePrices }: Props) {
    const status = HOUSE_STATUSES[plan.status]
    const { downPaymentEur, monthsToSave } = plan.lowestPaymentGoal

    return (
        <Card className="gap-0 py-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5 lg:px-6">
                <h3 className="text-xl font-semibold tracking-tight tabular-nums">
                    {formatCurrency(plan.priceEur, Currency.EUR, 0)}
                </h3>
                <Badge className={cn(status.badgeClassName, { 'blur-sm': hidePrices })}>
                    {status.label}
                </Badge>
            </div>

            <ol className="flex flex-col divide-y">
                {plan.stars.map((star, index) => (
                    <StarRow
                        key={star.key}
                        star={star}
                        priceEur={plan.priceEur}
                        gaugeMaxEur={gaugeMaxEur}
                        netSalaryEur={netSalaryEur}
                        showLimitLabel={index === plan.stars.length - 1}
                        hidePrices={hidePrices}
                    />
                ))}
            </ol>

            <p className="border-t p-5 text-xs text-muted-foreground tabular-nums lg:px-6">
                For a {formatPaymentEur(HEALTHY_PAYMENT_EUR.min)} payment you would need{' '}
                {formatEstimateEur(downPaymentEur)} down
                <span className={cn({ 'blur-sm select-none': hidePrices })}>
                    {monthsToSave !== 0 && `, ${formatTimeToSave(monthsToSave)} of saving`}
                </span>
                .
            </p>
        </Card>
    )
}
