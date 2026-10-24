import * as React from 'react'

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarTrigger,
} from '@/components/ui/sidebar'
import Image from 'next/image'
import { SignOutApp } from '@/modules/auth/sign-out-app'
import { NavMain } from '@/components/app-sidebar/app-sidebar-nav'
import type { NavCounts } from '@/components/app-sidebar/app-sidebar.constants'
import { getIsDev } from '@/lib/utils/index.server'

type Props = React.ComponentProps<typeof Sidebar> & {
    counts: NavCounts
}

export function AppSidebar({ counts, ...props }: Props) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader className="pt-3 pb-1">
                <div className="flex items-center gap-3 px-1.5">
                    <Image
                        src="/assets/logo.webp"
                        width={32}
                        height={32}
                        className="object-cover shrink-0 group-data-[collapsible=icon]:hidden"
                        alt="Migueli Guru Finances Logo"
                        unoptimized
                    />
                    <span className="text-base font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
                        Migueli Finances
                    </span>
                    <SidebarTrigger className="ml-auto cursor-pointer group-data-[collapsible=icon]:ml-0" />
                </div>
            </SidebarHeader>
            <SidebarContent className="gap-1">
                <NavMain isDev={getIsDev()} counts={counts} />
            </SidebarContent>
            <SidebarFooter className="py-3 flex flex-col gap-5">
                <Image
                    src="/assets/funny.webp"
                    width={280}
                    height={200}
                    className="w-full rounded-none group-data-[collapsible=icon]:hidden"
                    alt="Vais ser pobre para sempre"
                    unoptimized
                    loading="eager"
                />
                <SignOutApp />
            </SidebarFooter>
        </Sidebar>
    )
}
