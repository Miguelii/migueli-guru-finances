import type { Metadata } from 'next'
import { createCaller } from '@/_bff/trpc/caller'
import { searchParamsCache } from '@/lib/core/searchParams'
import { ExpensesCard } from '@/modules/expenses/expenses-card'

export const metadata: Metadata = {
    title: 'Expenses | Migueli Guru Finances',
}

type Props = PageProps<'/portfolio/expenses'>

export default async function ExpensesPage(props: Props) {
    const trpc = await createCaller()

    const [settings, payslips, searchParams] = await Promise.all([
        trpc.settings.get(),
        trpc.payslips.getAll(),
        searchParamsCache.parse(props.searchParams),
    ])

    return (
        <main className="flex flex-col gap-6 mb-24 min-w-0" id="main">
            <ExpensesCard
                netSalaryEur={settings.netMonthlySalaryEur}
                // Meal allowance of the newest payslip, the best guess for a typical month
                mealAllowanceEur={payslips[0]?.meal_allowance ?? 0}
                expenses={settings.monthlyExpenses}
                hidePrices={searchParams.hide_prices}
            />
        </main>
    )
}
