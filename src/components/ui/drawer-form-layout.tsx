'use client'

import { XIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'

type Props = {
    title: string
    description: string
    closeLabel: string
    cancelLabel?: string
    closeDisabled?: boolean
    onDismiss: () => void
    primaryAction: ReactNode
    children?: ReactNode
}

// Form drawer frame: title and close button on top, a scrollable body, and Cancel plus the
// primary action pinned at the bottom (stacked on a phone, side by side on wider screens)
export function DrawerFormLayout({
    title,
    description,
    closeLabel,
    cancelLabel = 'Cancel',
    closeDisabled = false,
    onDismiss,
    primaryAction,
    children,
}: Props) {
    return (
        <>
            <DrawerHeader className="relative shrink-0 border-b px-12 py-5 md:px-6 md:pr-14">
                <DrawerTitle className="text-2xl font-bold tracking-tight">{title}</DrawerTitle>
                <DrawerDescription>{description}</DrawerDescription>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={closeLabel}
                    disabled={closeDisabled}
                    onClick={onDismiss}
                    className="absolute top-4 right-3 cursor-pointer"
                >
                    <XIcon />
                </Button>
            </DrawerHeader>
            {children && (
                <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-5 md:p-6">
                    {children}
                </div>
            )}
            <div className="flex w-full shrink-0 flex-col gap-2 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:flex-row md:items-center md:p-6">
                <Button
                    type="button"
                    variant="outline"
                    disabled={closeDisabled}
                    onClick={onDismiss}
                    className="h-11 w-full cursor-pointer md:h-9 md:flex-1"
                >
                    {cancelLabel}
                </Button>
                <div className="w-full md:flex-1 [&>button]:h-11 [&>button]:w-full md:[&>button]:h-9">
                    {primaryAction}
                </div>
            </div>
        </>
    )
}
