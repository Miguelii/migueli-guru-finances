'use client'

import { Loader2Icon, LogOutIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { trpcClient } from '@/_trpc/client'

export function SignOutApp() {
    const router = useRouter()

    const signOut = trpcClient.auth.signOut.useMutation({
        onSuccess: () => router.refresh(),
    })

    function onClick() {
        signOut.mutate()
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            disabled={signOut.isPending}
            className="h-9 w-full cursor-pointer px-2.5 flex flex-row gap-1.5 ring-1 ring-foreground/10 bg-background"
        >
            {signOut.isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
            ) : (
                <LogOutIcon className="size-4" />
            )}
            <span>Sign Out</span>
        </Button>
    )
}
