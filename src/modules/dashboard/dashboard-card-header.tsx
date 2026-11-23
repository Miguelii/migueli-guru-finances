import Link from 'next/link'
import { ChevronRightIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type Props = {
    id: string
    title: string
    subtitle?: string
    href?: string
    linkLabel?: string
    actions?: ReactNode
}

export function DashboardCardHeader({ id, title, subtitle, href, linkLabel, actions }: Props) {
    return (
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-0.5">
                <h2 id={id} className="text-sm font-semibold">
                    {title}
                </h2>
                {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
                {actions}
                {href && linkLabel && (
                    <Link
                        href={href}
                        className="inline-flex items-center gap-0.5 rounded-md text-xs font-medium text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        {linkLabel}
                        <ChevronRightIcon aria-hidden="true" className="size-3.5" />
                    </Link>
                )}
            </div>
        </div>
    )
}
