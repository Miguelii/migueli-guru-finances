'use client'

import * as React from 'react'
import { Drawer as DrawerPrimitive } from '@base-ui/react/drawer'

import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

// A bottom sheet on a phone (swipe down to dismiss), a side panel from the right on wider screens
function Drawer({ swipeDirection, open, ...props }: DrawerPrimitive.Root.Props) {
    const isMobile = useIsMobile()
    // Base UI only plays the enter animation when `open` turns true after mount, so a lazily
    // mounted drawer (already open on its first render) starts closed and opens one commit later.
    // This also lets `useIsMobile` settle first, so the first open slides in the right direction
    const [hasMounted, setHasMounted] = React.useState(false)

    React.useEffect(() => setHasMounted(true), [])

    return (
        <DrawerPrimitive.Root
            data-slot="drawer"
            swipeDirection={swipeDirection ?? (isMobile ? 'down' : 'right')}
            open={open === undefined ? undefined : open && hasMounted}
            {...props}
        />
    )
}

function DrawerTrigger({ ...props }: DrawerPrimitive.Trigger.Props) {
    return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerClose({ ...props }: DrawerPrimitive.Close.Props) {
    return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({ className, ...props }: DrawerPrimitive.Backdrop.Props) {
    return (
        <DrawerPrimitive.Backdrop
            data-slot="drawer-overlay"
            className={cn(
                'fixed inset-0 z-50 min-h-dvh bg-black [--backdrop-opacity:0.2] dark:[--backdrop-opacity:0.6] opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] supports-backdrop-filter:backdrop-blur-xs data-swiping:duration-0 data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] motion-reduce:transition-none',
                className
            )}
            {...props}
        />
    )
}

function DrawerContent({ className, children, ...props }: DrawerPrimitive.Popup.Props) {
    return (
        <DrawerPrimitive.VirtualKeyboardProvider>
            <DrawerPrimitive.Portal data-slot="drawer-portal">
                <DrawerOverlay />
                <DrawerPrimitive.Viewport
                    data-slot="drawer-viewport"
                    className="fixed inset-0 z-50 flex items-end justify-center md:items-stretch md:justify-end"
                >
                    <DrawerPrimitive.Popup
                        data-slot="drawer-content"
                        className={cn(
                            'group/drawer-content relative flex w-full flex-col overflow-hidden bg-background text-sm text-foreground shadow-lg outline-none transition-transform duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:select-none data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] motion-reduce:transition-none',
                            // Bottom sheet (phone)
                            'data-[swipe-direction=down]:max-h-[90dvh] data-[swipe-direction=down]:rounded-t-xl data-[swipe-direction=down]:border-t data-[swipe-direction=down]:[transform:translateY(var(--drawer-swipe-movement-y))] data-[swipe-direction=down]:data-starting-style:[transform:translateY(100%)] data-[swipe-direction=down]:data-ending-style:[transform:translateY(100%)]',
                            // Side panel (tablet and desktop)
                            'data-[swipe-direction=right]:h-full data-[swipe-direction=right]:max-w-md data-[swipe-direction=right]:border-l data-[swipe-direction=right]:[transform:translateX(var(--drawer-swipe-movement-x))] data-[swipe-direction=right]:data-starting-style:[transform:translateX(100%)] data-[swipe-direction=right]:data-ending-style:[transform:translateX(100%)]',
                            className
                        )}
                        {...props}
                    >
                        <div
                            aria-hidden="true"
                            className="mx-auto mt-4 hidden h-1 w-25 shrink-0 rounded-full bg-muted group-data-[swipe-direction=down]/drawer-content:block"
                        />
                        <DrawerPrimitive.Content
                            data-slot="drawer-body"
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            {children}
                        </DrawerPrimitive.Content>
                    </DrawerPrimitive.Popup>
                </DrawerPrimitive.Viewport>
            </DrawerPrimitive.Portal>
        </DrawerPrimitive.VirtualKeyboardProvider>
    )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="drawer-header"
            className={cn(
                'flex flex-col gap-0.5 p-4 group-data-[swipe-direction=down]/drawer-content:text-center md:text-left',
                className
            )}
            {...props}
        />
    )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="drawer-footer"
            className={cn('mt-auto flex flex-col gap-2 p-4', className)}
            {...props}
        />
    )
}

function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
    return (
        <DrawerPrimitive.Title
            data-slot="drawer-title"
            className={cn('text-base font-medium text-foreground', className)}
            {...props}
        />
    )
}

function DrawerDescription({ className, ...props }: DrawerPrimitive.Description.Props) {
    return (
        <DrawerPrimitive.Description
            data-slot="drawer-description"
            className={cn('text-sm text-muted-foreground', className)}
            {...props}
        />
    )
}

export {
    Drawer,
    DrawerTrigger,
    DrawerClose,
    DrawerContent,
    DrawerHeader,
    DrawerFooter,
    DrawerTitle,
    DrawerDescription,
}
