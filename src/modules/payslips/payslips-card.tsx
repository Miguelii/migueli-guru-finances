'use client'

import { Plus } from 'lucide-react'
import { useHasOpened } from '@/hooks/use-has-opened'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import type { Payslip } from '@/types/Payslip'
import { PortfolioCard } from '@/modules/portfolio-card/portfolio-card'
import { DeletePayslipDialog } from '@/modules/payslips/delete-payslip-dialog'
import { LazyPayslipDrawer } from '@/modules/payslips/payslips-card.lazy'
import { PayslipsSummary } from '@/modules/payslips/payslips-summary'
import { PayslipsTable } from '@/modules/payslips/payslips-table'
import { usePayslipsCard } from '@/modules/payslips/use-payslips-card'

type Props = {
    payslips: Payslip[]
    hidePrices: boolean
}

export function PayslipsCard({ payslips, hidePrices }: Props) {
    const {
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
    } = usePayslipsCard(payslips)
    const hasOpenedDrawer = useHasOpened(drawer.open)

    const yearItems = years.map((value) => ({ value, label: String(value) }))

    return (
        <>
            <PortfolioCard
                cardId="payslips"
                title="Payslips"
                className="w-full min-w-0"
                openHeightClassName="h-full"
                contentClassName="flex w-full min-w-0 flex-col gap-6"
                actions={
                    <>
                        <Select value={year} onValueChange={changeYear} items={yearItems}>
                            <SelectTrigger
                                aria-label="Payslips year"
                                className="h-8 min-w-20 cursor-pointer text-xs tabular-nums"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {yearItems.map((item) => (
                                    <SelectItem
                                        key={item.value}
                                        value={item.value}
                                        className="text-xs tabular-nums"
                                    >
                                        {item.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            size="sm"
                            onClick={() => openCreate()}
                            className="h-8 cursor-pointer gap-1 px-2.5"
                        >
                            <Plus className="size-4" />
                            Add
                        </Button>
                    </>
                }
            >
                <PayslipsSummary year={year} totals={totals} hidePrices={hidePrices} />
                <PayslipsTable
                    year={year}
                    rows={rows}
                    totals={totals}
                    hidePrices={hidePrices}
                    onAdd={openCreate}
                    onEdit={openEdit}
                />
            </PortfolioCard>

            {hasOpenedDrawer && (
                <LazyPayslipDrawer
                    open={drawer.open}
                    onOpenChange={onDrawerOpenChange}
                    payslips={payslips}
                    payslip={drawer.open ? drawer.payslip : null}
                    year={year}
                    month={drawer.open ? drawer.month : null}
                    onDelete={openDelete}
                />
            )}

            <DeletePayslipDialog
                open={deleting !== null}
                onOpenChange={onDeleteDialogOpenChange}
                payslip={deleting}
            />
        </>
    )
}
