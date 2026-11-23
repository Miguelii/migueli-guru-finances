import * as React from 'react'

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar'
import Image from 'next/image'
import Link from 'next/link'
import { SignOutApp } from '@/modules/auth/sign-out-app'
import { NavMain } from '@/components/app-sidebar/app-sidebar-nav'
import type { NavCounts } from '@/components/app-sidebar/app-sidebar.constants'
import { PRIVATE_ROUTE_PATH } from '@/lib/constants'
import { getIsDev } from '@/lib/utils/index.server'

type Props = React.ComponentProps<typeof Sidebar> & {
    counts: NavCounts
}

export function AppSidebar({ counts, ...props }: Props) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader className="h-16 justify-center border-b px-3 group-data-[collapsible=icon]:px-2">
                <Link
                    href={PRIVATE_ROUTE_PATH}
                    className="flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                >
                    <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary">
                        <Image
                            src="/assets/logo.webp"
                            width={28}
                            height={28}
                            className="size-7 object-cover"
                            alt="Migueli Guru Finances Logo"
                            unoptimized
                        />
                    </span>
                    <span className="truncate text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
                        Migueli Finances
                    </span>
                </Link>
            </SidebarHeader>
            <SidebarContent className="gap-1 py-2">
                <NavMain isDev={getIsDev()} counts={counts} />
            </SidebarContent>
            <SidebarFooter className="flex flex-col gap-4 py-3">
                <Image
                    src="/assets/funny.webp"
                    width={280}
                    height={200}
                    className="w-full rounded-lg group-data-[collapsible=icon]:hidden"
                    alt="Vais ser pobre para sempre"
                    unoptimized
                    loading="eager"
                />
                <SignOutApp />
            </SidebarFooter>
        </Sidebar>
    )
}
