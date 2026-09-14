'use client'

import { startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCwIcon, TriangleAlertIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
    error: Error & { digest?: string }
    reset: () => void
}

export default function PortfolioError({ error, reset }: Props) {
    const router = useRouter()

    function onRetry() {
        startTransition(() => {
            router.refresh()
            reset()
        })
    }

    return (
        <main className="flex flex-col items-center justify-center gap-6 py-24 text-center">
            <div className="flex h-12 w-12 items-center justify-center bg-destructive/10">
                <TriangleAlertIcon className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex flex-col gap-2">
                <h2 className="text-lg font-bold tracking-tight">Something went wrong</h2>
                <p className="max-w-sm text-sm text-muted-foreground">
                    We couldn&apos;t load your portfolio. Please try again in a moment.
                </p>
                {error.digest && (
                    <span className="text-xs text-muted-foreground">Ref: {error.digest}</span>
                )}
            </div>
            <Button onClick={onRetry} className="cursor-pointer">
                <RefreshCwIcon className="size-4" />
                Try again
            </Button>
        </main>
    )
}
