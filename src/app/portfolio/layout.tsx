import { cookies } from 'next/headers'
import { AppSidebar } from '@/components/app-sidebar'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { HidePrices } from '@/components/hide-prices'
import { ToggleTheme } from '@/components/toggle-theme'

type Props = LayoutProps<'/portfolio'>

export const dynamic = 'force-dynamic'

export default async function PortfolioDashboard({ children }: Props) {
    const cookieStore = await cookies()

    const sidebarStateCookie = cookieStore.get('sidebar_state')
    const sidebarState =
        sidebarStateCookie?.value == null ? true : sidebarStateCookie.value !== 'false'

    return (
        <SidebarProvider
            defaultOpen={sidebarState}
            style={
                {
                    '--sidebar-width': 'calc(var(--spacing) * 54)',
                    '--header-height': 'calc(var(--spacing) * 12)',
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" />
            <SidebarInset className="min-w-0 overflow-hidden">
                <div className="flex flex-col gap-6 p-4 pt-2 md:p-6 md:pt-4 w-full min-w-0 overflow-hidden">
                    <div className="flex w-full items-center gap-1 justify-center border-b border-muted-foreground/10 pt-2 sm:pt-0 pb-4">
                        <SidebarTrigger className="-ml-1 h-8 cursor-pointer md:hidden" />
                        <Separator
                            orientation="vertical"
                            className="mx-2 h-4 top-2 relative md:hidden"
                        />
                        <h1 className="text-base font-bold w-full">Portfolio</h1>
                        <div className="flex flex-row gap-3">
                            <HidePrices />
                            <ToggleTheme />
                        </div>
                    </div>
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
