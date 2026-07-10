'use client'

import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { paramsUrlKeys } from '@/lib/searchParams'

export function HidePrices() {
    const [hide, setHide] = useQueryState(paramsUrlKeys.hide_prices!, parseAsBoolean)

    function onClick() {
        setHide(!hide)
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            aria-label={hide ? 'Show Prices' : 'Hide Prices'}
            className="h-8 w-fit cursor-pointer px-2.5 flex flex-row gap-1.5 ring-1 ring-foreground/10"
        >
            {!hide ? <EyeIcon className="size-4" /> : <EyeOffIcon className="size-4" />}
        </Button>
    )
}
