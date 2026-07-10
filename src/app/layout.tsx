import '@/styles/globals.css'
import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Analytics as VercelAnalytics } from '@vercel/analytics/react'
import { SpeedInsights as VercelSpeedInsights } from '@vercel/speed-insights/next'
import { ServiceWorkerRegister } from '@/components/service-worker-register'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { ClientEnv } from '@/env/client'
import { ThemeProvider } from '@/providers/theme-provider'
import { Themes } from '@/types/Themes'
import { TrpcContextProvider } from '@/_trpc/context/trpc-context.provider'

const geistSans = Geist({
    variable: '--font-sans',
    subsets: ['latin'],
    display: 'swap',
    preload: true,
    adjustFontFallback: true,
})

const DEFAULT_META_TITLE = 'Migueli Guru Finances'

const DEFAULT_META_DESCRIPTION = 'Private app for tracking Crypto, ETF, and Stock investments'

const WEBSITE_URL = ClientEnv.NEXT_PUBLIC_VERCEL_URL

export const metadata: Metadata = {
    metadataBase: WEBSITE_URL ? new URL(WEBSITE_URL) : undefined,
    title: {
        default: DEFAULT_META_TITLE,
        template: `%s | ${DEFAULT_META_TITLE}`,
    },
    description: DEFAULT_META_DESCRIPTION,
    keywords: [
        'Miguel Gonçalves',
        'Finances',
        'Crypto',
        'ETF',
        'Stock',
        'Investments',
        'Private portfolio',
        'Next.js',
        'TypeScript',
        'nuqs',
        'Effect',
        'Tailwind CSS',
    ],
    creator: 'Miguel Gonçalves',
    publisher: 'Miguel Gonçalves',
    authors: [
        {
            name: 'Miguel Gonçalves',
            url: 'https://www.linkedin.com/in/miguelgoncalves18/',
        },
    ],
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    alternates: {
        canonical: WEBSITE_URL,
    },
    openGraph: {
        locale: 'en_US',
        siteName: DEFAULT_META_TITLE,
        title: DEFAULT_META_TITLE,
        description: DEFAULT_META_DESCRIPTION,
        type: 'website',
        url: WEBSITE_URL ? new URL(WEBSITE_URL) : undefined,
    },
    twitter: {
        title: DEFAULT_META_TITLE,
        description: DEFAULT_META_DESCRIPTION,
        creator: '@migueligoncal',
        site: WEBSITE_URL ?? undefined,
        card: 'summary_large_image',
    },
}

export const viewport: Viewport = {
    colorScheme: 'light dark',
    width: 'device-width',
    initialScale: 1,
    height: 'device-height',
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#fbfbfd' },
        { media: '(prefers-color-scheme: dark)', color: '#1c1c1c' },
    ],
}

type Props = LayoutProps<'/'>

export default function RootLayout({ children }: Props) {
    return (
        <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
            <head>
                <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
                <meta name="apple-mobile-web-app-title" content="GuruFiances" />
            </head>
            <VercelAnalytics />
            <VercelSpeedInsights />
            <body
                className={`${geistSans.variable} font-sans antialiased bg-background text-primary`}
            >
                <a
                    tabIndex={0}
                    aria-label="Skip to content"
                    className="sr-only sr-only-focusable"
                    id="acessibilitynav"
                    href="#main"
                >
                    Skip to content
                </a>
                <TrpcContextProvider>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme={Themes.Light}
                        enableSystem
                        disableTransitionOnChange
                        storageKey="migueli-finances-theme"
                    >
                        <NuqsAdapter defaultOptions={{ shallow: false }}>
                            <TooltipProvider>
                                <div className="flex-1">{children}</div>
                            </TooltipProvider>
                            <Toaster />
                        </NuqsAdapter>
                    </ThemeProvider>
                </TrpcContextProvider>
                <ServiceWorkerRegister />
            </body>
        </html>
    )
}
