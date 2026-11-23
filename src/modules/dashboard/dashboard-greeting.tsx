import { getFirstName, getGreeting } from '@/modules/dashboard/dashboard-greeting.helpers'

type Props = {
    name: string | null
}

export function DashboardGreeting({ name }: Props) {
    const firstName = getFirstName(name)
    const greeting = getGreeting(new Date())

    return (
        <div className="flex flex-col gap-0.5">
            <p className="text-xs text-muted-foreground">Dashboard</p>
            <h1 className="text-2xl font-semibold tracking-tight">
                {firstName ? `${greeting}, ${firstName}` : greeting}
            </h1>
            <p className="text-sm text-muted-foreground">
                Here&apos;s a quick look at your portfolio.
            </p>
        </div>
    )
}
