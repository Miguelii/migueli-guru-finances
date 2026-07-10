'use client'

import { Loader2Icon, RefreshCwIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { trpcClient } from '@/_trpc/client'

export function RefreshApp() {
    const router = useRouter()

    const updatePrices = trpcClient.assets.updateTickersPrices.useMutation({
        onSuccess: () => {
            toast.success('Prices updated successfully!')
            router.refresh()
        },
        onError: () => toast.error('An error occurred while updating prices.'),
    })

    function onClick() {
        updatePrices.mutate()
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            disabled={updatePrices.isPending}
            className="h-9 w-fit cursor-pointer px-2.5 flex flex-row gap-1.5 ring-1 ring-foreground/10 bg-background"
        >
            {updatePrices.isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
            ) : (
                <RefreshCwIcon className="size-4" />
            )}
            <span>Update prices</span>
        </Button>
    )
}
