import { useState } from 'react'
import type { Transaction } from '@/types/Transaction'

export function useTransactionsCardActions() {
    const [createOpen, setCreateOpen] = useState(false)
    const [editing, setEditing] = useState<Transaction | null>(null)
    const [deleting, setDeleting] = useState<Transaction | null>(null)

    const openCreate = () => setCreateOpen(true)

    const openEdit = (transaction: Transaction) => setEditing(transaction)

    const openDelete = (transaction: Transaction) => setDeleting(transaction)

    // The drawer is shared by create and edit, so closing it resets both
    const onDrawerOpenChange = (open: boolean) => {
        if (open) return
        setCreateOpen(false)
        setEditing(null)
    }

    const onDeleteDialogOpenChange = (open: boolean) => {
        if (!open) setDeleting(null)
    }

    return {
        isDrawerOpen: createOpen || editing !== null,
        isDeleteDialogOpen: deleting !== null,
        editing,
        deleting,
        openCreate,
        openEdit,
        openDelete,
        onDrawerOpenChange,
        onDeleteDialogOpenChange,
    }
}
