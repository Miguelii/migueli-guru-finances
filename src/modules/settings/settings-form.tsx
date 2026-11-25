'use client'

import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Loader2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/portfolio/formaters'
import { trpcClient } from '@/lib/trpc'
import { parseDecimalInput } from '@/lib/utils'
import { Currency } from '@/types/core/Currency'
import type { UserSettings } from '@/types/UserSettings'
import { SETTINGS_FIELDS } from '@/modules/settings/settings-form.constants'
import {
    toSettingsFormValues,
    toSettingsPayload,
    type SettingsFormValues,
} from '@/modules/settings/settings-form.helpers'

type Props = {
    settings: UserSettings
    // Net salary of the newest payslip, offered as a one-click fill
    latestPayslipNetSalaryEur: number | null
}

export function SettingsForm({ settings, latestPayslipNetSalaryEur }: Props) {
    const router = useRouter()
    const form = useForm<SettingsFormValues>({ defaultValues: toSettingsFormValues(settings) })
    const { isDirty } = form.formState
    const isUnset = settings.netMonthlySalaryEur === null && settings.emergencyFundGoalEur === null

    // After a save the server sends the stored values back: make them the new baseline
    useEffect(() => {
        form.reset(toSettingsFormValues(settings))
    }, [settings, form])

    const updateSettings = trpcClient.settings.update.useMutation({
        onSuccess: () => {
            toast.success('Settings saved successfully!')
            router.refresh()
        },
        onError: (error) => toast.error(`An error occurred: ${error.message}`),
    })

    function onSubmit(values: SettingsFormValues) {
        const payload = toSettingsPayload(values)
        if (payload) updateSettings.mutate(payload)
    }

    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                    <CardTitle>Personal settings</CardTitle>
                    {isUnset && <Badge variant="outline">Not set yet</Badge>}
                </div>
                <CardDescription>
                    Values used across the app. Changes apply to every page once saved.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="flex flex-col gap-6"
                    noValidate
                >
                    <Controller
                        name="netMonthlySalaryEur"
                        control={form.control}
                        rules={{
                            validate: (value) =>
                                parseDecimalInput(value) !== null ||
                                SETTINGS_FIELDS.netMonthlySalaryEur.errorMessage,
                        }}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={field.name}>
                                    {SETTINGS_FIELDS.netMonthlySalaryEur.label}
                                </FieldLabel>
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
                                        {SETTINGS_FIELDS.netMonthlySalaryEur.description}
                                    </FieldDescription>
                                )}
                                {latestPayslipNetSalaryEur !== null && (
                                    <Button
                                        type="button"
                                        variant="link"
                                        className="h-auto w-fit cursor-pointer p-0 text-xs text-brand"
                                        onClick={() =>
                                            form.setValue(
                                                'netMonthlySalaryEur',
                                                String(latestPayslipNetSalaryEur).replace('.', ','),
                                                { shouldDirty: true, shouldValidate: true }
                                            )
                                        }
                                    >
                                        Use latest payslip (
                                        {formatCurrency(latestPayslipNetSalaryEur, Currency.EUR)})
                                    </Button>
                                )}
                            </Field>
                        )}
                    />

                    <Controller
                        name="emergencyFundGoalEur"
                        control={form.control}
                        rules={{
                            validate: (value) =>
                                (parseDecimalInput(value) ?? 0) > 0 ||
                                SETTINGS_FIELDS.emergencyFundGoalEur.errorMessage,
                        }}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={field.name}>
                                    {SETTINGS_FIELDS.emergencyFundGoalEur.label}
                                </FieldLabel>
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
                                        {SETTINGS_FIELDS.emergencyFundGoalEur.description}
                                    </FieldDescription>
                                )}
                            </Field>
                        )}
                    />

                    <div className="flex flex-col gap-2 border-t pt-4 md:flex-row md:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={!isDirty || updateSettings.isPending}
                            onClick={() => form.reset()}
                            className="h-11 cursor-pointer md:h-9"
                        >
                            Discard changes
                        </Button>
                        <Button
                            type="submit"
                            disabled={!isDirty || updateSettings.isPending}
                            className="h-11 cursor-pointer md:h-9"
                        >
                            {updateSettings.isPending ? (
                                <span className="flex items-center gap-2">
                                    <Loader2Icon className="size-4 animate-spin" />
                                    Saving...
                                </span>
                            ) : (
                                'Save settings'
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
