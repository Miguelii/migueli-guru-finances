'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AssetDrawer } from '@/modules/watchlist/asset-drawer'
import { DeleteAssetDialog } from '@/modules/watchlist/delete-asset-dialog'
import type { TickerData } from '@/types/Transaction'
import { Pencil, Trash2 } from 'lucide-react'

type Props = {
    asset: TickerData
}

export function AssetActions({ asset }: Props) {
    const [editing, setEditing] = useState(false)
    const [deleting, setDeleting] = useState(false)

    return (
        <div className="flex justify-end gap-1">
            <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Edit asset"
                className="cursor-pointer"
                onClick={() => setEditing(true)}
            >
                <Pencil />
            </Button>
            <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Delete asset"
                className="cursor-pointer text-destructive hover:text-destructive"
                onClick={() => setDeleting(true)}
            >
                <Trash2 />
            </Button>

            <AssetDrawer
                open={editing}
                onOpenChange={(open) => {
                    if (!open) setEditing(false)
                }}
                asset={asset}
            />

            <DeleteAssetDialog
                open={deleting}
                onOpenChange={(open) => {
                    if (!open) setDeleting(false)
                }}
                asset={deleting ? asset : null}
            />
        </div>
    )
}
