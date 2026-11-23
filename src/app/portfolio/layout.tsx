import { cookies } from 'next/headers'
import { AppHeader } from '@/components/app-header/app-header'
import { PageHeading } from '@/components/app-header/page-heading'
import { AppSidebar } from '@/components/app-sidebar/app-sidebar'
import { getNavCounts } from '@/components/app-sidebar/app-sidebar.helpers'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Effect } from 'effect'
import { PORTFOLIO_CARD_DISCLOSURE_COOKIE } from '@/modules/portfolio-card/portfolio-card.constants'
import { parsePortfolioCardState } from '@/modules/portfolio-card/portfolio-card.helpers'
import { PortfolioCardProvider } from '@/modules/portfolio-card/portfolio-card.provider'
import { getLatestUpdate } from '@/lib/utils'
import { getPortfolioData } from '@/lib/portfolio/portfolio-data.server'

type Props = LayoutProps<'/portfolio'>

export const dynamic = 'force-dynamic'

export default async function PortfolioDashboard({ children }: Props) {
    const { sidebarState, cardState } = await Effect.runPromise(
        Effect.gen(function* () {
            const cookieStore = yield* Effect.promise(() => cookies())
            const cookieValues = yield* Effect.sync(() => ({
                sidebarState: cookieStore.get('sidebar_state')?.value,
                cardState: cookieStore.get(PORTFOLIO_CARD_DISCLOSURE_COOKIE)?.value,
            }))

            return {
                // Collapsed to the icon rail until the user expands it
                sidebarState: cookieValues.sidebarState === 'true',
                cardState: parsePortfolioCardState(cookieValues.cardState),
            }
        })
    )

    const { transactions, data, holdings } = await getPortfolioData()

    return (
        <SidebarProvider
            defaultOpen={sidebarState}
            style={
                // SAFETY: these are the CSS custom properties consumed by the sidebar layout.
                {
                    '--sidebar-width': 'calc(var(--spacing) * 60)',
                    '--sidebar-width-icon': 'calc(var(--spacing) * 14)',
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="sidebar" counts={getNavCounts(transactions, data, holdings)} />
            <SidebarInset className="min-w-0 overflow-x-clip bg-background">
                <AppHeader lastUpdate={getLatestUpdate(data)} holdings={holdings} />
                <PortfolioCardProvider initialState={cardState}>
                    <div className="flex w-full min-w-0 flex-col gap-6 p-4 md:p-6">
                        <PageHeading />
                        {children}
                    </div>
                </PortfolioCardProvider>
            </SidebarInset>
        </SidebarProvider>
    )
}
