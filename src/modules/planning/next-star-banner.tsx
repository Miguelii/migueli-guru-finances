import { Card } from '@/components/ui/card'
import { formatCurrency, formatMonthTick } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import { Currency } from '@/types/core/Currency'
import {
    AFFORDABILITY_LATER_MONTHS,
    HEALTHY_PAYMENT_EUR,
} from '@/modules/planning/house-planner-card.constants'
import {
    formatEstimateEur,
    formatPaymentEur,
    formatTimeToSave,
    type NextStar,
} from '@/modules/planning/house-planner-card.helpers'
import { StarMark } from '@/modules/planning/star-mark'

type Props = {
    nextStar: NextStar | null
    savedEur: number
    affordability: { todayEur: number; laterEur: number }
    hidePrices: boolean
}

type NextStarGoalProps = {
    nextStar: NextStar
    savedEur: number
    hidePrices: boolean
}

const NextStarGoal = ({
    nextStar: { priceEur, star },
    savedEur,
    hidePrices,
}: NextStarGoalProps) => (
    <div className={cn('flex flex-col gap-3', { 'blur-sm select-none': hidePrices })}>
        <h2 className="text-2xl font-semibold tracking-tight text-balance tabular-nums">
            {star.label} on the {formatCurrency(priceEur, Currency.EUR, 0)} house
        </h2>
        <div
            role="progressbar"
            aria-label="Progress to the next star"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(star.progressPct)}
            className="h-3 overflow-hidden bg-foreground/10"
        >
            <div
                className="h-full origin-left bg-primary transition-transform duration-300 ease-out motion-reduce:transition-none"
                style={{ transform: `scaleX(${star.progressPct / 100})` }}
            />
        </div>
        <p className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 tabular-nums">
            <span className="font-medium">
                {formatEstimateEur(star.downPaymentEur - savedEur)} to go
            </span>
            <span className="text-muted-foreground">
                {formatTimeToSave(star.monthsToSave)}
                {star.reachMonth && `, ${formatMonthTick(star.reachMonth)}`}
            </span>
        </p>
    </div>
)

export function NextStarBanner({ nextStar, savedEur, affordability, hidePrices }: Props) {
    return (
        <Card className="gap-4 p-5 lg:p-6">
            <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                <StarMark isEarned={false} />
                Next star
            </p>
            {nextStar ? (
                <NextStarGoal nextStar={nextStar} savedEur={savedEur} hidePrices={hidePrices} />
            ) : (
                <h2 className="text-2xl font-semibold tracking-tight">Every star earned</h2>
            )}
            <p className="border-t pt-4 text-muted-foreground tabular-nums">
                A {formatPaymentEur(HEALTHY_PAYMENT_EUR.max)} payment buys up to{' '}
                <span
                    className={cn('font-medium text-foreground', {
                        'blur-sm select-none': hidePrices,
                    })}
                >
                    {formatEstimateEur(affordability.todayEur)}
                </span>{' '}
                today and{' '}
                <span
                    className={cn('font-medium text-foreground', {
                        'blur-sm select-none': hidePrices,
                    })}
                >
                    {formatEstimateEur(affordability.laterEur)}
                </span>{' '}
                in {AFFORDABILITY_LATER_MONTHS / 12} years.
            </p>
        </Card>
    )
}
