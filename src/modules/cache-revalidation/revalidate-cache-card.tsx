'use client'

import { CheckIcon, DatabaseZapIcon, Loader2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { CACHE_KEY_DESCRIPTION } from '@/_bff/modules/cache/cache.constants'
import { CACHE_KEY_ITEMS } from '@/modules/cache-revalidation/revalidate-cache-card.constants'
import { formatRevalidatedAt } from '@/modules/cache-revalidation/revalidate-cache-card.helpers'
import { useRevalidateCacheCard } from '@/modules/cache-revalidation/use-revalidate-cache-card'

export function RevalidateCacheCard() {
    const { selectedKey, changeKey, confirm, isPending, lastResult } = useRevalidateCacheCard()

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <DatabaseZapIcon className="size-4" />
                    Revalidate cache
                </CardTitle>
                <CardDescription>
                    Development only. Expires every entry of the selected{' '}
                    <code className="font-mono">unstable_cache</code> key right away, so the next
                    render reads fresh data from Supabase.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="cache-key">Cache key</Label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Select
                            value={selectedKey}
                            onValueChange={changeKey}
                            items={CACHE_KEY_ITEMS}
                        >
                            <SelectTrigger
                                id="cache-key"
                                className="h-10! w-full sm:max-w-[80%] shrink-0 font-mono sm:flex-1"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CACHE_KEY_ITEMS.map(({ value, label }) => (
                                    <SelectItem key={value} value={value} className="font-mono">
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            onClick={confirm}
                            disabled={isPending}
                            className="h-10 cursor-pointer gap-1.5 w-full sm:max-w-[20%]"
                        >
                            {isPending && <Loader2Icon className="size-4 animate-spin" />}
                            Revalidate
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {CACHE_KEY_DESCRIPTION[selectedKey]}
                    </p>
                </div>

                {lastResult && (
                    <p
                        className="flex items-center gap-1.5 text-xs text-success"
                        aria-live="polite"
                    >
                        <CheckIcon className="size-3.5" />
                        <span className="font-mono">{lastResult.key}</span> revalidated at{' '}
                        {formatRevalidatedAt(lastResult.revalidatedAt)}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
