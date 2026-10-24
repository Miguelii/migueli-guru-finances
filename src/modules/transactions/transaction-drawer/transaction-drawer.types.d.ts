import type { Currency } from '@/types/core/Currency'

type HoldingPreviewSide = {
    quantity: number
    avgCost: number
}

export type HoldingPreview = {
    currency: Currency
    before: HoldingPreviewSide
    after: HoldingPreviewSide
}
