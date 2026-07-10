'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

/**
 * Theme provider wrapper for next-themes.
 * @param props - Component props forwarded to NextThemesProvider.
 */
export function ThemeProvider({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
    return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
