'use client'

import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HEADER_BUTTON_CLASS } from '@/components/app-header/app-header.constants'
import { cn } from '@/lib/utils'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { paramsUrlKeys } from '@/lib/core/searchParams'

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
            className={cn(HEADER_BUTTON_CLASS, 'w-9 px-0')}
        >
            {!hide ? <EyeIcon className="size-4" /> : <EyeOffIcon className="size-4" />}
        </Button>
    )
}
