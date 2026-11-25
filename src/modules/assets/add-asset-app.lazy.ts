'use client'

import dynamic from 'next/dynamic'

export const LazyAssetDrawer = dynamic(
    () => import('@/modules/assets/asset-drawer').then((mod) => mod.AssetDrawer),
    { ssr: false }
)
