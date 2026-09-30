import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CACHE_KEYS, type CacheKey } from '@/_bff/modules/cache/cache.constants'
import { trpcClient } from '@/lib/trpc'

export function useRevalidateCacheCard() {
    const router = useRouter()
    const [selectedKey, setSelectedKey] = useState<CacheKey>(CACHE_KEYS[0])

    const revalidate = trpcClient.cache.revalidate.useMutation({
        onSuccess: ({ key }) => {
            toast.success(`Cache "${key}" revalidated!`)
            router.refresh()
        },
        onError: () => toast.error('An error occurred while revalidating the cache.'),
    })

    const changeKey = (value: CacheKey | null) => {
        if (value) setSelectedKey(value)
    }

    const confirm = () => revalidate.mutate({ key: selectedKey })

    return {
        selectedKey,
        changeKey,
        confirm,
        isPending: revalidate.isPending,
        lastResult: revalidate.data ?? null,
    }
}
