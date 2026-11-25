'use client'

import { parseDecimalInput } from '@/lib/utils'
import { Controller, type Control } from 'react-hook-form'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { type PayslipFormValues } from '@/modules/payslips/payslip-drawer/payslip-drawer.helpers'

type Props = {
    control: Control<PayslipFormValues>
    name: 'net_salary' | 'meal_allowance'
    label: string
    description: string
    errorMessage: string
    isOptional?: boolean
}

export function PayslipAmountField({
    control,
    name,
    label,
    description,
    errorMessage,
    isOptional = false,
}: Props) {
    return (
        <Controller
            name={name}
            control={control}
            rules={{
                validate: (value) =>
                    (isOptional && value.trim() === '') ||
                    parseDecimalInput(value) !== null ||
                    errorMessage,
            }}
            render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
                    <Input
                        {...field}
                        id={field.name}
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder="0,00"
                        className="tabular-nums"
                        aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid ? (
                        <FieldError>{fieldState.error?.message}</FieldError>
                    ) : (
                        <FieldDescription>{description}</FieldDescription>
                    )}
                </Field>
            )}
        />
    )
}
