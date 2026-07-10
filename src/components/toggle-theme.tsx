'use client'

import { MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
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
                        className="cursor-pointer ring-1 ring-foreground/10 h-8 relative"
                        onClick={() => onClickHandler()}
                    >
                        <SunIcon className="h-[1.2rem] w-[1.2rem] block dark:hidden" />
                        <MoonIcon className="h-[1.2rem] w-[1.2rem] hidden dark:block" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                }
            />
        </DropdownMenu>
    )
}
