import { CACHE_KEYS } from '@/_bff/modules/cache/cache.constants'

export const CACHE_KEY_ITEMS = CACHE_KEYS.map((key) => ({ value: key, label: key }))
