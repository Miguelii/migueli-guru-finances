import { AuthCard } from '@/modules/auth/auth-card'
import type { Metadata } from 'next'
import Image from 'next/image'
import { ToggleTheme } from '@/components/toggle-theme'

export const dynamic = 'force-static'

export const metadata: Metadata = {
    title: 'Login | Migueli Guru Finances',
}

export default function AuthPage() {
    return (
        <main className="flex min-h-svh" id="#main">
            {/* Left panel — gurus image */}
            <div className="hidden lg:flex lg:basis-1/2 relative flex-col items-center justify-center bg-muted/30 border-r border-border">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -left-40 h-80 w-80 rounded-none bg-chart-1/10 blur-3xl" />
                    <div className="absolute -right-40 -bottom-40 h-80 w-80 rounded-none bg-chart-3/10 blur-3xl" />
                </div>

                <div className="relative z-10 flex flex-col items-center gap-8 px-12">
                    <figure className="flex flex-col items-center gap-3">
                        <Image
                            src="/assets/funny.webp"
                            width={380}
                            height={280}
                            className="w-full max-w-sm rounded-none shadow-lg"
                            alt="Vais ser pobre para sempre"
                            unoptimized
                            loading="eager"
                        />
                        <figcaption className="text-xs text-muted-foreground italic">
                            Guru&apos;s financial motivation
                        </figcaption>
                    </figure>
                </div>
            </div>

            {/* Right panel — auth form */}
            <div className="flex flex-1 items-center justify-center p-6">
                <div className="absolute top-4 right-4">
                    <ToggleTheme />
                </div>
                <div className="flex w-full max-w-sm flex-col items-center gap-8">
                    <div className="flex w-full flex-col items-center gap-2">
                        <div className="flex h-15 w-15 items-center justify-center rounded-none bg-primary shadow-lg">
                            <Image
                                src="/assets/logo.webp"
                                width={64}
                                height={64}
                                className="object-cover h-16 w-16 rounded-none "
                                alt="Migueli Guru Finances Logo"
                                unoptimized
                            />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Migueli Finances</h1>
                        <div className="inline-flex items-center gap-2 rounded-none border border-border bg-secondary/50 px-4 py-2 text-xs text-muted-foreground">
                            <span>End-to-end encrypted</span>
                            <span className="text-muted-foreground/40">|</span>
                            <span>Bank-grade security</span>
                        </div>
                    </div>

                    <AuthCard />
                </div>
            </div>
        </main>
    )
}
