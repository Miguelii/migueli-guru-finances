import { ClockIcon } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { HidePrices } from '@/modules/dashboard-actions/hide-prices'
import { RefreshApp } from '@/modules/dashboard-actions/refresh-app'
import { ToggleTheme } from '@/modules/dashboard-actions/toggle-theme'
import { PortfolioExport } from '@/modules/portfolio-export/portfolio-export'
import type { HoldingSummary } from '@/types/Holding'

type Props = {
    lastUpdate: string
    holdings: HoldingSummary[]
}

export function AppHeader({ lastUpdate, holdings }: Props) {
    return (
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur md:px-6">
            <SidebarTrigger className="-ml-1 size-9 cursor-pointer rounded-lg" />

            <div className="ml-auto flex items-center gap-2">
                <p className="hidden h-9 items-center gap-2 rounded-lg border bg-card px-3 text-xs text-muted-foreground shadow-xs xl:flex">
                    <ClockIcon aria-hidden="true" className="size-3.5" />
                    <span>
                        Updated <span className="font-medium text-foreground">{lastUpdate}</span>
                    </span>
                </p>
                <RefreshApp />
                <PortfolioExport holdings={holdings} />
                <HidePrices />
                <ToggleTheme />
            </div>
        </header>
    )
}
