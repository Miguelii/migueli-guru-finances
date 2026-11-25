import { useState } from 'react'
import { useQueryState } from 'nuqs'
import { paramsUrlKeys, payslipsYearParser } from '@/lib/core/searchParams'
import type { Payslip } from '@/types/Payslip'
import {
    getPayslipYears,
    getYearRows,
    getYearTotals,
    resolveSelectedYear,
} from '@/modules/payslips/payslips-card.helpers'

export type PayslipDrawerState =
    | { open: false }
    | { open: true; payslip: Payslip | null; month: number | null }

// Filtered on the client from props: shallow skips the server re-render the adapter default triggers
const CLIENT_ONLY = { shallow: true } as const

export function usePayslipsCard(payslips: Payslip[]) {
    const [requestedYear, setYear] = useQueryState(
        paramsUrlKeys.payslips_year!,
        payslipsYearParser.withOptions(CLIENT_ONLY)
    )
    const [drawer, setDrawer] = useState<PayslipDrawerState>({ open: false })
    const [deleting, setDeleting] = useState<Payslip | null>(null)

    const years = getPayslipYears(payslips, new Date().getFullYear())
    const year = resolveSelectedYear(requestedYear, years)
    const rows = getYearRows(payslips, year)
    const totals = getYearTotals(rows)

    const changeYear = (value: number | null) => {
        if (value !== null) void setYear(value)
    }

    const openCreate = (month: number | null = null) =>
        setDrawer({ open: true, payslip: null, month })

    const openEdit = (payslip: Payslip) => setDrawer({ open: true, payslip, month: null })

    const onDrawerOpenChange = (open: boolean) => {
        if (!open) setDrawer({ open: false })
    }

    // Delete lives in the edit drawer: close it first so the dialog is not stacked on top
    const openDelete = (payslip: Payslip) => {
        setDrawer({ open: false })
        setDeleting(payslip)
    }

    const onDeleteDialogOpenChange = (open: boolean) => {
        if (!open) setDeleting(null)
    }

    return {
        year,
        years,
        rows,
        totals,
        drawer,
        deleting,
        changeYear,
        openCreate,
        openEdit,
        openDelete,
        onDrawerOpenChange,
        onDeleteDialogOpenChange,
    }
}
