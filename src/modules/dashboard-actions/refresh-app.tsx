'use client'

import { Loader2Icon, RefreshCwIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HEADER_BUTTON_CLASS } from '@/components/app-header/app-header.constants'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { trpcClient } from '@/lib/trpc'

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
            className={cn(HEADER_BUTTON_CLASS, 'w-fit')}
            aria-label="Update prices"
        >
            {updatePrices.isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
            ) : (
                <RefreshCwIcon className="size-4" />
            )}
            <span className="hidden lg:inline">Update prices</span>
        </Button>
    )
}
