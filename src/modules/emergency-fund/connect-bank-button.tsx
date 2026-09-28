'use client'

import { Landmark, Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { trpcClient } from '@/lib/trpc'

type Props = {
    label: string
}

export function ConnectBankButton({ label }: Props) {
    const startConnection = trpcClient.bank.startConnection.useMutation({
        // Hands the browser to the bank, which redirects back to /api/bank/callback
        onSuccess: ({ url }) => window.location.assign(url),
        onError: () => toast.error('Could not start the bank connection.'),
    })

    const isRedirecting = startConnection.isPending || startConnection.isSuccess

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={() => startConnection.mutate()}
            disabled={isRedirecting}
            className="cursor-pointer w-full"
        >
            {isRedirecting ? (
                <Loader2Icon className="size-4 animate-spin" />
            ) : (
                <Landmark className="size-4" />
            )}
            <span>{label}</span>
        </Button>
    )
}
