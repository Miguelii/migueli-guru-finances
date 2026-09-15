import type { Currency } from '@/types/Transaction'

type HoldingPreviewSide = {
    quantity: number
    avgCost: number
}

export type HoldingPreview = {
    currency: Currency
    before: HoldingPreviewSide
    after: HoldingPreviewSide
}
