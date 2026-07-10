import { ClientEnv } from '@/env/client'
import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
    const WEBSITE_URL = ClientEnv.NEXT_PUBLIC_VERCEL_URL!

    return [
        {
            url: WEBSITE_URL,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 1,
        },
    ]
}
