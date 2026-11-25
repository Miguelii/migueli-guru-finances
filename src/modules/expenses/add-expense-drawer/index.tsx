'use client'

import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Loader2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { DrawerFormLayout } from '@/components/ui/drawer-form-layout'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { trpcClient } from '@/lib/trpc'
import { cn, parseDecimalInput } from '@/lib/utils'
import { EXPENSE_CATEGORY_META } from '@/modules/expenses/expenses.constants'
import {
    CATEGORY_ITEMS,
    EMPTY_EXPENSE_VALUES,
    EXPENSE_NAME_MAX_LENGTH,
} from '@/modules/expenses/add-expense-drawer/add-expense-drawer.constants'
import {
    toExpensePayload,
    type ExpenseFormValues,
} from '@/modules/expenses/add-expense-drawer/add-expense-drawer.helpers'

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function AddExpenseDrawer({ open, onOpenChange }: Props) {
    const router = useRouter()
    const form = useForm<ExpenseFormValues>({ defaultValues: EMPTY_EXPENSE_VALUES })

    useEffect(() => {
        if (open) form.reset(EMPTY_EXPENSE_VALUES)
    }, [open, form])

    const addExpense = trpcClient.settings.addExpense.useMutation({
        onSuccess: () => {
            toast.success('Expense added successfully!')
            onOpenChange(false)
            router.refresh()
        },
        onError: (error) => toast.error(`An error occurred: ${error.message}`),
    })

    function onSubmit(values: ExpenseFormValues) {
        const payload = toExpensePayload(values)
        if (payload) addExpense.mutate(payload)
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
                        title="Add expense"
                        description="A cost you pay every month, like rent, groceries or a subscription."
                        closeLabel="Close expense drawer"
                        closeDisabled={addExpense.isPending}
                        onDismiss={() => onOpenChange(false)}
                        primaryAction={
                            <Button
                                type="submit"
                                disabled={addExpense.isPending}
                                className="cursor-pointer"
                            >
                                {addExpense.isPending ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2Icon className="size-4 animate-spin" />
                                        Saving...
                                    </span>
                                ) : (
                                    'Add expense'
                                )}
                            </Button>
                        }
                    >
                        <Controller
                            name="name"
                            control={form.control}
                            rules={{
                                validate: (value) =>
                                    value.trim() !== '' || 'Give the expense a name, e.g. Rent',
                            }}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                                    <Input
                                        {...field}
                                        id={field.name}
                                        autoComplete="off"
                                        maxLength={EXPENSE_NAME_MAX_LENGTH}
                                        placeholder="e.g. Rent"
                                        className="h-11 md:h-9"
                                        aria-invalid={fieldState.invalid}
                                    />
                                    <FieldError>{fieldState.error?.message}</FieldError>
                                </Field>
                            )}
                        />

                        <Controller
                            name="category"
                            control={form.control}
                            render={({ field }) => (
                                <Field>
                                    <FieldLabel htmlFor={field.name}>Category</FieldLabel>
                                    <Select
                                        value={field.value}
                                        onValueChange={(value) => {
                                            if (value) field.onChange(value)
                                        }}
                                        items={CATEGORY_ITEMS}
                                    >
                                        <SelectTrigger
                                            id={field.name}
                                            className="h-11 w-full cursor-pointer md:h-9"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORY_ITEMS.map((item) => (
                                                <SelectItem key={item.value} value={item.value}>
                                                    <span className="flex items-center gap-2">
                                                        <span
                                                            aria-hidden="true"
                                                            className={cn(
                                                                'size-2.5 rounded-full',
                                                                EXPENSE_CATEGORY_META[item.value]
                                                                    .swatchClassName
                                                            )}
                                                        />
                                                        {item.label}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>
                            )}
                        />

                        <Controller
                            name="amount"
                            control={form.control}
                            rules={{
                                validate: (value) =>
                                    (parseDecimalInput(value) ?? 0) > 0 ||
                                    'Enter the monthly amount, e.g. 750',
                            }}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>Monthly amount (€)</FieldLabel>
                                    <Input
                                        {...field}
                                        id={field.name}
                                        inputMode="decimal"
                                        autoComplete="off"
                                        placeholder="0,00"
                                        className="h-11 tabular-nums md:h-9"
                                        aria-invalid={fieldState.invalid}
                                    />
                                    {fieldState.invalid ? (
                                        <FieldError>{fieldState.error?.message}</FieldError>
                                    ) : (
                                        <FieldDescription>
                                            For a yearly cost, divide it by 12.
                                        </FieldDescription>
                                    )}
                                </Field>
                            )}
                        />
                    </DrawerFormLayout>
                </form>
            </DrawerContent>
        </Drawer>
    )
}
