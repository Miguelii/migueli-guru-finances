'use client'

import { parseDecimalInput } from '@/lib/utils'
import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Loader2Icon, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { DrawerFormLayout } from '@/components/ui/drawer-form-layout'
import { formatCurrency } from '@/lib/portfolio/formaters'
import { trpcClient } from '@/lib/trpc'
import { Currency } from '@/types/core/Currency'
import type { Payslip } from '@/types/Payslip'
import {
    MONTH_ITEMS,
    NOTE_MAX_LENGTH,
} from '@/modules/payslips/payslip-drawer/payslip-drawer.constants'
import {
    getCreateValues,
    getSubmitLabel,
    isMonthTaken,
    parseYearInput,
    toFormValues,
    type PayslipFormValues,
} from '@/modules/payslips/payslip-drawer/payslip-drawer.helpers'
import { PayslipAmountField } from '@/modules/payslips/payslip-drawer/payslip-amount-field'

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    payslips: Payslip[]
    payslip: Payslip | null
    year: number
    month: number | null
    onDelete: (payslip: Payslip) => void
}

export function PayslipDrawer({
    open,
    onOpenChange,
    payslips,
    payslip,
    year,
    month,
    onDelete,
}: Props) {
    const router = useRouter()
    const isEdit = payslip !== null
    const prefilledFromLatest = !isEdit && payslips.length > 0

    const form = useForm<PayslipFormValues>({
        defaultValues: getCreateValues(payslips, year, month),
    })

    const [netSalary, mealAllowance] = useWatch({
        control: form.control,
        name: ['net_salary', 'meal_allowance'],
    })
    const total = (parseDecimalInput(netSalary) ?? 0) + (parseDecimalInput(mealAllowance) ?? 0)

    useEffect(() => {
        if (open)
            form.reset(payslip ? toFormValues(payslip) : getCreateValues(payslips, year, month))
    }, [open, payslip, payslips, year, month, form])

    function onMutationSuccess() {
        toast.success(isEdit ? 'Payslip updated successfully!' : 'Payslip added successfully!')
        onOpenChange(false)
        router.refresh()
    }

    function onMutationError(error: { message: string; data?: { code?: string } | null }) {
        if (error.data?.code === 'CONFLICT') {
            form.setError('month', { message: 'There is already a payslip for this month' })
            return
        }

        toast.error(`An error occurred: ${error.message}`)
    }

    const createPayslip = trpcClient.payslips.create.useMutation({
        onSuccess: onMutationSuccess,
        onError: onMutationError,
    })

    const updatePayslip = trpcClient.payslips.update.useMutation({
        onSuccess: onMutationSuccess,
        onError: onMutationError,
    })

    const isPending = createPayslip.isPending || updatePayslip.isPending

    function onSubmit(values: PayslipFormValues) {
        const payload = {
            year: parseYearInput(values.year) ?? year,
            month: Number(values.month),
            net_salary: parseDecimalInput(values.net_salary) ?? 0,
            meal_allowance: parseDecimalInput(values.meal_allowance) ?? 0,
            note: values.note.trim() || undefined,
        }

        if (payslip) {
            updatePayslip.mutate({ ...payload, id: payslip.id })
        } else {
            createPayslip.mutate(payload)
        }
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="flex min-h-0 flex-1 flex-col"
                    noValidate
                >
                    <DrawerFormLayout
                        title={isEdit ? 'Edit payslip' : 'Add payslip'}
                        description={
                            isEdit
                                ? 'Update the amounts received this month.'
                                : 'Record the net salary and meal allowance received in a month.'
                        }
                        closeLabel="Close payslip drawer"
                        closeDisabled={isPending}
                        onDismiss={() => onOpenChange(false)}
                        primaryAction={
                            <Button type="submit" disabled={isPending} className="cursor-pointer">
                                {isPending ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2Icon className="size-4 animate-spin" />
                                        Saving...
                                    </span>
                                ) : (
                                    getSubmitLabel(isEdit)
                                )}
                            </Button>
                        }
                    >
                        <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-3">
                            <Controller
                                name="month"
                                control={form.control}
                                rules={{
                                    required: 'Please pick a month',
                                    validate: (value, values) => {
                                        const formYear = parseYearInput(values.year)
                                        if (formYear === null) return true

                                        return (
                                            !isMonthTaken(
                                                payslips,
                                                formYear,
                                                Number(value),
                                                payslip?.id ?? null
                                            ) || 'There is already a payslip for this month'
                                        )
                                    },
                                }}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor={field.name}>Month</FieldLabel>
                                        <Select
                                            value={field.value}
                                            onValueChange={(value) => {
                                                field.onChange(value ?? '')
                                                form.clearErrors('month')
                                            }}
                                            items={MONTH_ITEMS}
                                        >
                                            <SelectTrigger
                                                id={field.name}
                                                className="w-full cursor-pointer"
                                                aria-invalid={fieldState.invalid}
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {MONTH_ITEMS.map((item) => (
                                                    <SelectItem key={item.value} value={item.value}>
                                                        {item.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FieldError>{fieldState.error?.message}</FieldError>
                                    </Field>
                                )}
                            />

                            <Controller
                                name="year"
                                control={form.control}
                                rules={{
                                    validate: (value) =>
                                        parseYearInput(value) !== null || 'Enter a valid year',
                                }}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor={field.name}>Year</FieldLabel>
                                        <Input
                                            {...field}
                                            onChange={(event) => {
                                                field.onChange(event)
                                                form.clearErrors('month')
                                            }}
                                            id={field.name}
                                            inputMode="numeric"
                                            autoComplete="off"
                                            maxLength={4}
                                            className="tabular-nums"
                                            aria-invalid={fieldState.invalid}
                                        />
                                        <FieldError>{fieldState.error?.message}</FieldError>
                                    </Field>
                                )}
                            />
                        </div>

                        <PayslipAmountField
                            control={form.control}
                            name="net_salary"
                            label="Net salary (€)"
                            description="Base salary received after taxes and deductions."
                            errorMessage="Enter the net salary, e.g. 2532,28"
                        />

                        <PayslipAmountField
                            control={form.control}
                            name="meal_allowance"
                            label="Meal allowance (€)"
                            description="Paid on the meal card. Leave empty when there is none."
                            errorMessage="Enter the meal allowance, e.g. 193,80"
                            isOptional
                        />

                        <Controller
                            name="note"
                            control={form.control}
                            render={({ field }) => (
                                <Field>
                                    <FieldLabel htmlFor={field.name}>
                                        Note{' '}
                                        <span className="font-normal text-muted-foreground">
                                            (optional)
                                        </span>
                                    </FieldLabel>
                                    <Input
                                        {...field}
                                        id={field.name}
                                        autoComplete="off"
                                        maxLength={NOTE_MAX_LENGTH}
                                        placeholder="e.g. Bonus"
                                    />
                                </Field>
                            )}
                        />

                        <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2.5">
                            <span className="text-sm text-muted-foreground">Total received</span>
                            <span className="text-base font-semibold tabular-nums">
                                {formatCurrency(total, Currency.EUR)}
                            </span>
                        </div>

                        {prefilledFromLatest && (
                            <p className="text-xs text-muted-foreground">
                                Amounts are copied from your latest payslip.
                            </p>
                        )}

                        {payslip && (
                            <div className="mt-auto border-t pt-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => onDelete(payslip)}
                                    disabled={isPending}
                                    className="h-11 w-full cursor-pointer text-destructive hover:text-destructive md:h-9 md:w-auto"
                                >
                                    <Trash2 />
                                    Delete payslip
                                </Button>
                            </div>
                        )}
                    </DrawerFormLayout>
                </form>
            </DrawerContent>
        </Drawer>
    )
}
