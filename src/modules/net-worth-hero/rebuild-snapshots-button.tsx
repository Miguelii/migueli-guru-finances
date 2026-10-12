'use client'

import { HistoryIcon, Loader2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { trpcClient } from '@/lib/trpc'
import { getRebuildToast } from '@/modules/net-worth-hero/rebuild-snapshots-button.helpers'

export function RebuildSnapshotsButton() {
    const router = useRouter()

    const rebuild = trpcClient.snapshots.rebuild.useMutation({
        onSuccess: (result) => {
            const { message, warning } = getRebuildToast(result)
            toast.success(message)
            if (warning) toast.warning(warning)
            router.refresh()
        },
        onError: () => toast.error('An error occurred while rebuilding the history.'),
    })

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => rebuild.mutate()}
            disabled={rebuild.isPending}
            className="cursor-pointer gap-1.5 text-xs text-muted-foreground"
        >
            {rebuild.isPending ? (
                <Loader2Icon aria-hidden="true" className="size-3.5 animate-spin" />
            ) : (
                <HistoryIcon aria-hidden="true" className="size-3.5" />
            )}
            {rebuild.isPending ? 'Rebuilding…' : 'Rebuild history'}
        </Button>
    )
}
