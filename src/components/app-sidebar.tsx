'use client'

import * as React from 'react'

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
    useSidebar,
} from '@/components/ui/sidebar'
import { NAV_GROUPS, type NavGroup } from '@/components/app-sidebar.constants'
import Image from 'next/image'
import Link from 'next/link'
import { SignOutApp } from '@/modules/auth/sign-out-app'
import { useIsMobile } from '@/hooks/use-mobile'
import { useCallback } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

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
                <NavMain groups={NAV_GROUPS} />
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

function NavMain({ groups }: { groups: NavGroup[] }) {
    const sidebar = useSidebar()
    const isMobile = useIsMobile()

    const pathname = usePathname()
    const searchParams = useSearchParams()

    const onClick = useCallback(() => {
        if (isMobile) sidebar.toggleSidebar()
    }, [isMobile, sidebar])

    return (
        <>
            {groups.map((group, index) => (
                <SidebarGroup key={group.label ?? index}>
                    {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
                    <SidebarGroupContent className="flex flex-col gap-2">
                        <SidebarMenu>
                            {group.items.map((item) => {
                                const Icon = item.Icon
                                return (
                                    <Link
                                        key={item.title}
                                        className="contents"
                                        prefetch={false}
                                        href={`${item.url}?${searchParams.toString()}`}
                                        onClick={() => onClick()}
                                    >
                                        <SidebarMenuItem>
                                            <SidebarMenuButton
                                                tooltip={item.title}
                                                isActive={pathname === item.url}
                                                className="cursor-pointer!"
                                            >
                                                {Icon && <Icon />}
                                                <span>{item.title}</span>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    </Link>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            ))}
        </>
    )
}
