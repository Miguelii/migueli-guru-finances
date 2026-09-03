import { Currency, TickerService, TickerType } from '@/types/Transaction'
import { z } from 'zod'

export const createAssetSchema = z.object({
    ticker: z
        .string()
        .trim()
        .min(1)
        .max(15)
        .regex(/^[A-Z0-9.\-=]+$/u),
    type: z.enum(TickerType),
    currency: z.enum(Currency),
    service: z.enum(TickerService),
    symbol: z.enum(['€', '$', '€-$', '$-€']),
    hex_color: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/u)
        .optional(),
    image: z
        .string()
        .regex(/^data:image\/(png|jpe?g|webp|gif|avif);base64,[A-Za-z0-9+/=]+$/u)
        .max(3_000_000)
        .optional(),
})

export type CreateAssetProps = z.infer<typeof createAssetSchema>

// bucket-relative path: leading slash, no ".." segments,
// optional `?v=<timestamp>` cache-busting suffix (see uploadAssetImage)
export const assetLogoPathSchema = z
    .string()
    .max(200)
    .regex(/^\/(?!.*\.\.)[\w\-./]+(?:\?v=\d+)?$/u)

export const deleteAssetSchema = z.object({
    ticker: z
        .string()
        .trim()
        .min(1)
        .max(15)
        .regex(/^[A-Z0-9.\-=]+$/u),
})
