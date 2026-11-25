import { formatCurrency } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import { Currency } from '@/types/core/Currency'
import type { PayslipYearTotals } from '@/modules/payslips/payslips-card.helpers'

type Props = {
    year: number
    totals: PayslipYearTotals
    hidePrices: boolean
}

type StatProps = {
    label: string
    value: number
    caption: string
    hidePrices: boolean
    isPrimary?: boolean
}

const Stat = ({ label, value, caption, hidePrices, isPrimary = false }: StatProps) => (
    <div className="flex min-w-0 flex-col gap-1">
        <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
        </dt>
        <dd
            className={cn('font-semibold tracking-tight tabular-nums', {
                'text-2xl': isPrimary,
                'text-lg': !isPrimary,
                'blur-md select-none': hidePrices,
            })}
        >
            {formatCurrency(value, Currency.EUR)}
        </dd>
        <dd className="text-xs text-muted-foreground">{caption}</dd>
    </div>
)

export function PayslipsSummary({ year, totals, hidePrices }: Props) {
    const monthsLabel = totals.count === 1 ? '1 month' : `${totals.count} months`

    return (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-4">
            <Stat
                label="Total received"
                value={totals.total}
                caption={`${monthsLabel} in ${year}`}
                hidePrices={hidePrices}
                isPrimary
            />
            <Stat
                label="Net salary"
                value={totals.netSalary}
                caption="Base after taxes"
                hidePrices={hidePrices}
            />
            <Stat
                label="Meal allowance"
                value={totals.mealAllowance}
                caption="Meal card"
                hidePrices={hidePrices}
            />
            <Stat
                label="Monthly average"
                value={totals.monthlyAverage}
                caption="Salary plus allowance"
                hidePrices={hidePrices}
            />
        </dl>
    )
}
