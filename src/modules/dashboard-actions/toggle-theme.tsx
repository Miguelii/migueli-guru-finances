'use client'

import { MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { HEADER_BUTTON_CLASS } from '@/components/app-header/app-header.constants'
import { cn } from '@/lib/utils'
import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Themes } from '@/types/Themes'
import { useCallback } from 'react'

export function ToggleTheme() {
    const { theme, setTheme } = useTheme()

    const currentTheme = theme || Themes.Light // Light is the default one

    const onClickHandler = useCallback(() => {
        if (currentTheme === Themes.Light) {
            setTheme(Themes.Dark)
        } else {
            setTheme(Themes.Light)
        }
    }, [currentTheme, setTheme])

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(HEADER_BUTTON_CLASS, 'relative w-9 px-0')}
                        onClick={() => onClickHandler()}
                    >
                        <SunIcon className="size-4 block dark:hidden" />
                        <MoonIcon className="size-4 hidden dark:block" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                }
            />
        </DropdownMenu>
    )
}
