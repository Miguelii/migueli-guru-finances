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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <div className="flex items-center gap-2.5 p-1.5">
                    <Image
                        src="/assets/logo.webp"
                        width={32}
                        height={32}
                        className="object-cover shrink-0 group-data-[collapsible=icon]:hidden"
                        alt="Migueli Guru Finances Logo"
                        unoptimized
                    />
                    <span className="text-base font-bold tracking-tight group-data-[collapsible=icon]:hidden">
                        Migueli Finances
                    </span>
                    <SidebarTrigger className="ml-auto cursor-pointer group-data-[collapsible=icon]:ml-0" />
                </div>
            </SidebarHeader>
            <SidebarContent>
                <NavMain />
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
