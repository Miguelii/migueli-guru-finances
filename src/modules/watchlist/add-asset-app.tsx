'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AssetDrawer } from '@/modules/watchlist/asset-drawer'
import { Plus } from 'lucide-react'

export function AddAssetApp() {
    const [open, setOpen] = useState(false)

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(true)}
                className="cursor-pointer gap-1 rounded-none px-2 py-1.5 text-sm h-8.5"
            >
                <Plus className="size-4" />
                Add asset
            </Button>

            <AssetDrawer open={open} onOpenChange={setOpen} asset={null} />
        </>
    )
}
