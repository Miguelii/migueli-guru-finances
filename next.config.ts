import type { NextConfig } from 'next'
import { withBotId } from 'botid/next/config'

const buildTimestamp = Date.now().toString()

const nextConfig: NextConfig = {
    experimental: {
        optimizePackageImports: [
            '@base-ui/react',
            '@hookform/resolvers',
            'class-variance-authority',
            'clsx',
            'react-hook-form',
            'shadcn',
            'sonner',
            'tailwind-merge',
            'tw-animate-css',
            'zod',
            'effect',
            'usehooks-ts',
        ],
    },
    reactCompiler: true,
    images: {
        qualities: [25, 50, 75, 100],
        localPatterns: [
            {
                pathname: '/assets/**',
            },
        ],
        minimumCacheTTL: 31536000, // 365 days
    },
    env: {
        NEXT_PUBLIC_BUILD_TIMESTAMP:
            process.env.NODE_ENV === 'production' ? buildTimestamp : undefined,
    },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'Referrer-Policy', value: 'no-referrer' },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains; preload',
                    },
                ],
            },
            {
                // CSP on the service worker response governs the worker's own
                // execution context; no-cache so browsers pick up SW updates
                source: '/sw.js',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: "default-src 'self'; script-src 'self'",
                    },
                    { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
                ],
            },
        ]
    },
}

export default withBotId(nextConfig)
