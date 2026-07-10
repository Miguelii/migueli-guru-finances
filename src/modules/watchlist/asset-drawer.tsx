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
import {
    ASSET_TYPES,
    type AssetFormValues,
    EMPTY_VALUES,
    MAX_IMAGE_SIZE_BYTES,
    readFileAsDataUrl,
    SERVICES,
    SYMBOLS,
    toFormValues,
} from '@/modules/watchlist/asset-drawer.helpers'
import { Currency, type TickerData } from '@/types/Transaction'
import { Loader2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    asset: TickerData | null
}

export function AssetDrawer({ open, onOpenChange, asset }: Props) {
    const router = useRouter()
    const isEdit = asset !== null

    const form = useForm<AssetFormValues>({ defaultValues: EMPTY_VALUES })

    useEffect(() => {
        if (open) form.reset(asset ? toFormValues(asset) : EMPTY_VALUES)
    }, [open, asset, form])

    const mutationOptions = {
        onSuccess: () => {
            toast.success(isEdit ? 'Asset updated successfully!' : 'Asset created successfully!')
            onOpenChange(false)
            form.reset(EMPTY_VALUES)
            router.refresh()
        },
        onError: (error: { message: string }) => toast.error(`An error occurred: ${error.message}`),
    }

    const createAsset = trpcClient.assets.create.useMutation(mutationOptions)
    const updateAsset = trpcClient.assets.update.useMutation(mutationOptions)

    const isPending = createAsset.isPending || updateAsset.isPending

    async function onSubmit(values: AssetFormValues) {
        const payload = {
            ticker: values.ticker.toUpperCase(),
            type: values.type,
            currency: values.currency,
            service: values.service,
            symbol: values.symbol,
            hex_color: values.hex_color === '' ? undefined : values.hex_color,
            image: values.image ? await readFileAsDataUrl(values.image) : undefined,
        }

        if (isEdit) updateAsset.mutate(payload)
        else createAsset.mutate(payload)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{isEdit ? 'Edit asset' : 'Add asset'}</SheetTitle>
                    <SheetDescription>
                        The current price is fetched automatically from the selected provider.
                    </SheetDescription>
                </SheetHeader>

                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="flex flex-1 flex-col gap-4 px-4 pb-4"
                >
                    <Controller
                        name="ticker"
                        control={form.control}
                        rules={{ required: true, pattern: /^[A-Za-z0-9.\-=]+$/u }}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={field.name}>Ticker</FieldLabel>
                                <Input
                                    {...field}
                                    id={field.name}
                                    className="uppercase"
                                    placeholder="e.g. BTC, VUAA"
                                    disabled={isEdit}
                                    aria-invalid={fieldState.invalid}
                                />
                                {fieldState.invalid && (
                                    <FieldError>Please enter a valid ticker symbol</FieldError>
                                )}
                            </Field>
                        )}
                    />

                    <Controller
                        name="type"
                        control={form.control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <Field>
                                <FieldLabel htmlFor={field.name}>Type</FieldLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger id={field.name} className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ASSET_TYPES.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>
                        )}
                    />

                    <Controller
                        name="currency"
                        control={form.control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <Field>
                                <FieldLabel htmlFor={field.name}>Currency</FieldLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger id={field.name} className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(Currency).map((currency) => (
                                            <SelectItem key={currency} value={currency}>
                                                {currency}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>
                        )}
                    />

                    <Controller
                        name="service"
                        control={form.control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <Field>
                                <FieldLabel htmlFor={field.name}>Price provider</FieldLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger id={field.name} className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SERVICES.map((service) => (
                                            <SelectItem key={service} value={service}>
                                                {service}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>
                        )}
                    />

                    <Controller
                        name="symbol"
                        control={form.control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <Field>
                                <FieldLabel htmlFor={field.name}>Symbol</FieldLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger id={field.name} className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SYMBOLS.map((symbol) => (
                                            <SelectItem key={symbol} value={symbol}>
                                                {symbol}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>
                        )}
                    />

                    <Controller
                        name="hex_color"
                        control={form.control}
                        rules={{ pattern: /^#[0-9a-fA-F]{6}$/u }}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={field.name}>Hex color (optional)</FieldLabel>
                                <Input
                                    {...field}
                                    id={field.name}
                                    placeholder="#627eea"
                                    aria-invalid={fieldState.invalid}
                                />
                                {fieldState.invalid && (
                                    <FieldError>Use the #rrggbb format</FieldError>
                                )}
                            </Field>
                        )}
                    />

                    <Controller
                        name="image"
                        control={form.control}
                        rules={{
                            validate: (file) =>
                                !file ||
                                (file.type.startsWith('image/') &&
                                    file.size <= MAX_IMAGE_SIZE_BYTES),
                        }}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={field.name}>Logo (optional)</FieldLabel>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    ref={field.ref}
                                    type="file"
                                    accept="image/*"
                                    onBlur={field.onBlur}
                                    onChange={(event) =>
                                        field.onChange(event.target.files?.[0] ?? null)
                                    }
                                    aria-invalid={fieldState.invalid}
                                />
                                {fieldState.invalid && (
                                    <FieldError>Please choose an image up to 2MB</FieldError>
                                )}
                            </Field>
                        )}
                    />

                    <SheetFooter className="px-0">
                        <Button type="submit" disabled={isPending} className="cursor-pointer">
                            {isPending ? (
                                <span className="flex items-center gap-2">
                                    <Loader2Icon className="size-4 animate-spin" />
                                    {isEdit ? 'Saving...' : 'Creating...'}
                                </span>
                            ) : isEdit ? (
                                'Save changes'
                            ) : (
                                'Add asset'
                            )}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}
