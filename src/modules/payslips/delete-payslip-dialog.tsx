'use client'

import { Loader2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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
import { trpcClient } from '@/lib/trpc'
import type { Payslip } from '@/types/Payslip'
import { formatMonthName } from '@/modules/payslips/payslips-card.helpers'

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    payslip: Payslip | null
}

export function DeletePayslipDialog({ open, onOpenChange, payslip }: Props) {
    const router = useRouter()

    const deletePayslip = trpcClient.payslips.delete.useMutation({
        onSuccess: () => {
            toast.success('Payslip deleted successfully!')
            onOpenChange(false)
            router.refresh()
        },
        onError: (error) => toast.error(`An error occurred: ${error.message}`),
    })

    function onConfirm() {
        if (payslip) deletePayslip.mutate({ id: payslip.id })
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete payslip?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {payslip &&
                            `This will permanently delete the payslip of ${formatMonthName(payslip.month)} ${payslip.year}. This action cannot be undone.`}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={deletePayslip.isPending}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={deletePayslip.isPending}
                        className="cursor-pointer"
                    >
                        {deletePayslip.isPending ? (
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
