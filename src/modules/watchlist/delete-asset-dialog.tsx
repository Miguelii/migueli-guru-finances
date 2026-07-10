'use client'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { trpcClient } from '@/_trpc/client'
import type { TickerData } from '@/types/Transaction'
import { Loader2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    asset: TickerData | null
}

export function DeleteAssetDialog({ open, onOpenChange, asset }: Props) {
    const router = useRouter()

    const deleteAsset = trpcClient.assets.delete.useMutation({
        onSuccess: () => {
            toast.success('Asset deleted successfully!')
            onOpenChange(false)
            router.refresh()
        },
        onError: (error) => toast.error(`An error occurred: ${error.message}`),
    })

    function onConfirm() {
        if (asset) deleteAsset.mutate({ ticker: asset.ticker })
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete asset?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {asset &&
                            `This will permanently delete ${asset.ticker} from the watchlist. This action cannot be undone.`}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleteAsset.isPending}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={deleteAsset.isPending}
                        className="cursor-pointer"
                    >
                        {deleteAsset.isPending ? (
                            <Loader2Icon className="size-4 animate-spin" />
                        ) : (
                            'Delete'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
