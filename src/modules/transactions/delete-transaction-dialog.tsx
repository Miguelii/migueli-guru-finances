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
import { formatDate } from '@/lib/formaters'
import type { Transaction } from '@/types/Transaction'
import { Loader2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    transaction: Transaction | null
}

export function DeleteTransactionDialog({ open, onOpenChange, transaction }: Props) {
    const router = useRouter()

    const deleteTransaction = trpcClient.transactions.delete.useMutation({
        onSuccess: () => {
            toast.success('Transaction deleted successfully!')
            onOpenChange(false)
            router.refresh()
        },
        onError: (error) => toast.error(`An error occurred: ${error.message}`),
    })

    function onConfirm() {
        if (transaction) deleteTransaction.mutate({ id: transaction.id })
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {transaction &&
                            `This will permanently delete the ${transaction.type} of ${transaction.ticker_id} from ${formatDate(transaction.buy_date)}. This action cannot be undone.`}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleteTransaction.isPending}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={deleteTransaction.isPending}
                        className="cursor-pointer"
                    >
                        {deleteTransaction.isPending ? (
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
