import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

export const DELTA_TONE_ICON = {
    positive: ArrowUpRight,
    negative: ArrowDownRight,
    neutral: Minus,
} as const

export const DELTA_TONE_LABEL = {
    positive: 'up',
    negative: 'down',
    neutral: 'unchanged',
} as const
