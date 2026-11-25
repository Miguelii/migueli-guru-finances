import type { Metadata } from 'next'
import { createCaller } from '@/_bff/trpc/caller'
import { SettingsForm } from '@/modules/settings/settings-form'

export const metadata: Metadata = {
    title: 'Settings | Migueli Guru Finances',
}

export default async function SettingsPage() {
    const trpc = await createCaller()

    const [settings, payslips] = await Promise.all([trpc.settings.get(), trpc.payslips.getAll()])

    return (
        <main className="flex flex-col gap-6 mb-24 min-w-0" id="main">
            <SettingsForm
                settings={settings}
                latestPayslipNetSalaryEur={payslips[0]?.net_salary ?? null}
            />
        </main>
    )
}
