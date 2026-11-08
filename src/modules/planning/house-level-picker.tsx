import { formatCurrency } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import { Currency } from '@/types/core/Currency'
import { HOUSE_STATUSES } from '@/modules/planning/house-planner-card.constants'
import type { HousePlan } from '@/modules/planning/house-planner-card.helpers'
import { StarMark } from '@/modules/planning/star-mark'

type Props = {
    plans: HousePlan[]
    selectedPriceEur: number | undefined
    hidePrices: boolean
    onSelect: (priceEur: number) => void
}

export function HouseLevelPicker({ plans, selectedPriceEur, hidePrices, onSelect }: Props) {
    return (
        <div
            role="group"
            aria-label="Choose a house"
            className="grid grid-cols-2 gap-3 lg:grid-cols-4"
        >
            {plans.map((plan) => {
                const isSelected = plan.priceEur === selectedPriceEur
                const earned = plan.stars.filter((star) => star.isEarned).length

                return (
                    <button
                        key={plan.priceEur}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => onSelect(plan.priceEur)}
                        className={cn(
                            'flex cursor-pointer flex-col gap-2 bg-card p-4 text-left ring-1 ring-foreground/10 transition-colors duration-150 outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none',
                            { 'ring-2 ring-foreground': isSelected }
                        )}
                    >
                        <span className="text-base font-semibold tracking-tight tabular-nums">
                            {formatCurrency(plan.priceEur, Currency.EUR, 0)}
                        </span>
                        <span
                            className={cn('flex flex-col gap-2', {
                                'blur-sm select-none': hidePrices,
                            })}
                        >
                            <span className="flex items-center gap-1">
                                {plan.stars.map((star) => (
                                    <StarMark key={star.key} isEarned={star.isEarned} />
                                ))}
                                <span className="sr-only">
                                    {earned} of {plan.stars.length} stars
                                </span>
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {HOUSE_STATUSES[plan.status].label}
                            </span>
                        </span>
                    </button>
                )
            })}
        </div>
    )
}
