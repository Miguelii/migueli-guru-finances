'use client'

import { useState } from 'react'
import { Loader2Icon, LogOutIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FORCE_SIGN_OUT_API_PATH } from '@/lib/constants'

export function SignOutApp() {
    const [isPending, setIsPending] = useState(false)

    function onClick() {
        setIsPending(true)
        window.location.assign(FORCE_SIGN_OUT_API_PATH)
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            disabled={isPending}
            className="h-8 w-full cursor-pointer px-2.5 flex flex-row gap-1.5 ring-1 ring-foreground/10 bg-background"
        >
            {isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
            ) : (
                <LogOutIcon className="size-4" />
            )}
            <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
        </Button>
    )
}
