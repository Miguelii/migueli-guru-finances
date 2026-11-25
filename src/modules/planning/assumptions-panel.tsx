'use client'

import { useState } from 'react'
import { RotateCcwIcon, SlidersHorizontalIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { formatPaymentEur, type HouseInputs } from '@/modules/planning/house-planner-card.helpers'

type Props = {
    inputs: HouseInputs
    savedEur: number
    monthlySavingEur: number
    netSalaryEur: number
    annualRatePct: number
    termYears: number
    hidePrices: boolean
    onChange: (key: keyof HouseInputs, value: string) => void
    onReset: () => void
}

type AssumptionFieldProps = {
    id: string
    label: string
    value: string
    suffix: string
    hint?: string
    isPrivate?: boolean
    onChange: (value: string) => void
}

const AssumptionField = ({
    id,
    label,
    value,
    suffix,
    hint,
    isPrivate = false,
    onChange,
}: AssumptionFieldProps) => (
    <Field>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <div className="relative">
            <Input
                id={id}
                inputMode="decimal"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className={cn('pr-12 tabular-nums', { 'blur-sm': isPrivate })}
            />
            <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-muted-foreground">
                {suffix}
            </span>
        </div>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </Field>
)

export function AssumptionsPanel({
    inputs,
    savedEur,
    monthlySavingEur,
    netSalaryEur,
    annualRatePct,
    termYears,
    hidePrices,
    onChange,
    onReset,
}: Props) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <Card className="gap-0 py-0">
            <div className="flex flex-wrap items-center justify-between gap-3 p-5 lg:px-6">
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground tabular-nums">
                    <li className={cn({ 'blur-sm select-none': hidePrices })}>
                        {formatPaymentEur(savedEur)} saved
                    </li>
                    <li className={cn({ 'blur-sm select-none': hidePrices })}>
                        {formatPaymentEur(monthlySavingEur)} / month
                    </li>
                    <li className={cn({ 'blur-sm select-none': hidePrices && netSalaryEur > 0 })}>
                        {netSalaryEur > 0
                            ? `${formatPaymentEur(netSalaryEur)} net salary`
                            : 'Net salary not set'}
                    </li>
                    <li>{annualRatePct}% TAN</li>
                    <li>{termYears} years</li>
                </ul>
                <Button
                    variant="outline"
                    size="sm"
                    aria-expanded={isOpen}
                    aria-controls="house-assumptions"
                    onClick={() => setIsOpen((current) => !current)}
                >
                    <SlidersHorizontalIcon />
                    Adjust
                </Button>
            </div>

            {isOpen && (
                <div id="house-assumptions" className="flex flex-col gap-4 border-t p-5 lg:px-6">
                    <div className="grid grid-cols-2 items-start gap-4 lg:grid-cols-5">
                        <AssumptionField
                            id="house-saved"
                            label="Already saved"
                            value={inputs.saved}
                            suffix="€"
                            hint="Starts at your portfolio value"
                            isPrivate={hidePrices}
                            onChange={(value) => onChange('saved', value)}
                        />
                        <AssumptionField
                            id="house-monthly-saving"
                            label="Saving per month"
                            value={inputs.monthlySaving}
                            suffix="€"
                            isPrivate={hidePrices}
                            onChange={(value) => onChange('monthlySaving', value)}
                        />
                        <AssumptionField
                            id="house-net-salary"
                            label="Net salary"
                            value={inputs.netSalary}
                            suffix="€"
                            isPrivate={hidePrices}
                            onChange={(value) => onChange('netSalary', value)}
                        />
                        <AssumptionField
                            id="house-annual-rate"
                            label="Interest rate"
                            value={inputs.annualRate}
                            suffix="% TAN"
                            onChange={(value) => onChange('annualRate', value)}
                        />
                        <AssumptionField
                            id="house-term"
                            label="Loan term"
                            value={inputs.term}
                            suffix="years"
                            onChange={(value) => onChange('term', value)}
                        />
                    </div>
                    <Button variant="ghost" size="xs" className="self-start" onClick={onReset}>
                        <RotateCcwIcon />
                        Reset
                    </Button>
                </div>
            )}
        </Card>
    )
}
