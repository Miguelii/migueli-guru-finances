'use client'

import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
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
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { trpcClient } from '@/_trpc/client'
import { TransactionType, type TickerData, type Transaction } from '@/types/Transaction'
import { Loader2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { toDbDate, toFormValues, toNumber } from './transaction-drawer.helpers'

export type FormValues = {
    ticker_id: string
    type: TransactionType
    buy_date: string
    quantity: string
    transaction_price: string
    value: string
    fee: string
    exchange_rate: string
}

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    tickerData: TickerData[]
    transaction: Transaction | null
}

const EMPTY_VALUES: FormValues = {
    ticker_id: '',
    type: TransactionType.Buy,
    buy_date: '',
    quantity: '',
    transaction_price: '',
    value: '',
    fee: '0',
    exchange_rate: '',
}

export function TransactionDrawer({ open, onOpenChange, tickerData, transaction }: Props) {
    const router = useRouter()
    const isEdit = transaction !== null

    const form = useForm<FormValues>({ defaultValues: EMPTY_VALUES })

    useEffect(() => {
        if (open) form.reset(transaction ? toFormValues(transaction) : EMPTY_VALUES)
    }, [open, transaction, form])

    function onMutationSuccess() {
        toast.success(
            isEdit ? 'Transaction updated successfully!' : 'Transaction created successfully!'
        )
        onOpenChange(false)
        router.refresh()
    }

    const createTransaction = trpcClient.transactions.create.useMutation({
        onSuccess: onMutationSuccess,
        onError: (error) => toast.error(`An error occurred: ${error.message}`),
    })

    const updateTransaction = trpcClient.transactions.update.useMutation({
        onSuccess: onMutationSuccess,
        onError: (error) => toast.error(`An error occurred: ${error.message}`),
    })

    const isPending = createTransaction.isPending || updateTransaction.isPending

    function onSubmit(values: FormValues) {
        const payload = {
            ticker_id: values.ticker_id,
            type: values.type,
            buy_date: toDbDate(values.buy_date),
            quantity: toNumber(values.quantity),
            transaction_price: toNumber(values.transaction_price),
            value: toNumber(values.value),
            fee: toNumber(values.fee) ?? 0,
            exchange_rate: toNumber(values.exchange_rate),
        }

        if (transaction) {
            updateTransaction.mutate({ ...payload, id: transaction.id })
        } else {
            createTransaction.mutate(payload)
        }
    }

    const getButtonLabel = () => {
        return isEdit ? 'Save changes' : 'Add transaction'
    }

    const assets = tickerData.filter((tick) => tick.type !== 'CAMBIO')

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{isEdit ? 'Edit transaction' : 'Add transaction'}</SheetTitle>
                    <SheetDescription>
                        {isEdit
                            ? 'Update the transaction details below.'
                            : 'Fill in the details of the new transaction.'}
                    </SheetDescription>
                </SheetHeader>

                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="flex flex-1 flex-col gap-4 px-4 pb-4"
                >
                    <Controller
                        name="ticker_id"
                        control={form.control}
                        rules={{ required: true }}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={field.name}>Asset</FieldLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger
                                        id={field.name}
                                        className="w-full"
                                        aria-invalid={fieldState.invalid}
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {assets.map((tick) => (
                                            <SelectItem key={tick.ticker} value={tick.ticker}>
                                                {tick.ticker}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {fieldState.invalid && (
                                    <FieldError>Please select an asset</FieldError>
                                )}
                            </Field>
                        )}
                    />

                    <Controller
                        name="type"
                        control={form.control}
                        rules={{ required: true }}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={field.name}>Type</FieldLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger
                                        id={field.name}
                                        className="w-full"
                                        aria-invalid={fieldState.invalid}
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(TransactionType).map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {fieldState.invalid && (
                                    <FieldError>Please select a type</FieldError>
                                )}
                            </Field>
                        )}
                    />

                    <Controller
                        name="buy_date"
                        control={form.control}
                        rules={{ required: true }}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={field.name}>Date</FieldLabel>
                                <Input
                                    {...field}
                                    id={field.name}
                                    type="datetime-local"
                                    aria-invalid={fieldState.invalid}
                                />
                                {fieldState.invalid && <FieldError>Please pick a date</FieldError>}
                            </Field>
                        )}
                    />

                    <Controller
                        name="quantity"
                        control={form.control}
                        render={({ field }) => (
                            <Field>
                                <FieldLabel htmlFor={field.name}>Quantity</FieldLabel>
                                <Input
                                    {...field}
                                    id={field.name}
                                    type="number"
                                    step="any"
                                    min="0"
                                    placeholder="0.00"
                                />
                            </Field>
                        )}
                    />

                    <Controller
                        name="transaction_price"
                        control={form.control}
                        render={({ field }) => (
                            <Field>
                                <FieldLabel htmlFor={field.name}>Buy Price</FieldLabel>
                                <Input
                                    {...field}
                                    id={field.name}
                                    type="number"
                                    step="any"
                                    min="0"
                                    placeholder="0.00"
                                />
                            </Field>
                        )}
                    />

                    <Controller
                        name="value"
                        control={form.control}
                        render={({ field }) => (
                            <Field>
                                <FieldLabel htmlFor={field.name}>Invested Value</FieldLabel>
                                <Input
                                    {...field}
                                    id={field.name}
                                    type="number"
                                    step="any"
                                    min="0"
                                    placeholder="0.00"
                                />
                            </Field>
                        )}
                    />

                    <Controller
                        name="fee"
                        control={form.control}
                        rules={{ required: true }}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={field.name}>Fee</FieldLabel>
                                <Input
                                    {...field}
                                    id={field.name}
                                    type="number"
                                    step="any"
                                    min="0"
                                    aria-invalid={fieldState.invalid}
                                />
                                {fieldState.invalid && <FieldError>Please enter a fee</FieldError>}
                            </Field>
                        )}
                    />

                    <Controller
                        name="exchange_rate"
                        control={form.control}
                        render={({ field }) => (
                            <Field>
                                <FieldLabel htmlFor={field.name}>
                                    Exchange rate (EUR per 1 USD/USDC)
                                </FieldLabel>
                                <Input
                                    {...field}
                                    id={field.name}
                                    type="number"
                                    step="any"
                                    min="0"
                                    placeholder="e.g. 0.87"
                                />
                            </Field>
                        )}
                    />

                    <SheetFooter className="px-0">
                        <Button type="submit" disabled={isPending} className="cursor-pointer">
                            {isPending ? (
                                <span className="flex items-center gap-2">
                                    <Loader2Icon className="size-4 animate-spin" />
                                    Saving...
                                </span>
                            ) : (
                                getButtonLabel()
                            )}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}
