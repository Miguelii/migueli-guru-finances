import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Compass, LockIcon } from 'lucide-react'

export default function NotFound() {
    return (
        <main className="flex min-h-svh items-center justify-center p-4">
            {/* Background glow effects — same language as AuthPage */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-40 -left-40 h-80 w-80 rounded-none bg-chart-1/10 blur-3xl" />
                <div className="absolute -right-40 -bottom-40 h-80 w-80 rounded-none bg-chart-3/10 blur-3xl" />
            </div>

            <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-10">
                {/* Logo mark */}
                <div className="flex h-14 w-14 items-center justify-center rounded-none bg-primary shadow-lg">
                    <LockIcon className="h-7 w-7 text-primary-foreground" />
                </div>

                {/* 404 hero */}
                <div className="flex flex-col items-center gap-3 text-center">
                    <span className="text-8xl font-black tracking-tighter text-foreground/10">
                        404
                    </span>
                    <h1 className="-mt-4 text-xl font-bold tracking-tight">Asset not found</h1>
                    <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                        The page you&apos;re looking for doesn&apos;t exist or has been moved to a
                        different address.
                    </p>
                </div>

                {/* Navigation hint */}
                <div className="flex items-center gap-2 rounded-none border border-border bg-secondary/50 px-4 py-2 text-xs text-muted-foreground">
                    <Compass className="h-3.5 w-3.5" />
                    <span>Double-check the URL or head back home</span>
                </div>

                {/* CTA */}
                <Link href="/" prefetch={false}>
                    <Button size="lg" className="h-11 cursor-pointer px-6 text-sm font-semibold">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </Link>
            </div>
        </main>
    )
}
