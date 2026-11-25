'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LazyAssetDrawer } from '@/modules/assets/add-asset-app.lazy'
import { useHasOpened } from '@/hooks/use-has-opened'
import { Plus } from 'lucide-react'

export function AddAssetApp() {
    const [open, setOpen] = useState(false)
    const hasOpenedDrawer = useHasOpened(open)

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(true)}
                className="cursor-pointer gap-1 px-2 py-1.5 text-sm h-8.5"
            >
                <Plus className="size-4" />
                Add asset
            </Button>

            {hasOpenedDrawer && <LazyAssetDrawer open={open} onOpenChange={setOpen} asset={null} />}
        </>
    )
}
