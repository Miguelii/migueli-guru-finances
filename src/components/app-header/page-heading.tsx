'use client'

import { usePathname } from 'next/navigation'
import { PAGE_HEADING_EYEBROW } from '@/components/app-header/app-header.constants'
import { getPageTitle } from '@/components/app-header/page-heading.helpers'

export function PageHeading() {
    const title = getPageTitle(usePathname())

    if (title === null) return null

    return (
        <div className="flex flex-col gap-0.5">
            <p className="text-xs text-muted-foreground">{PAGE_HEADING_EYEBROW}</p>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        </div>
    )
}
