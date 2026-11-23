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
            aria-label="Sign out"
            className="h-9 w-full cursor-pointer justify-start gap-2.5 rounded-lg px-2.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
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
