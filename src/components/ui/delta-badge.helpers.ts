export type DeltaTone = 'positive' | 'negative' | 'neutral'

export function getDeltaTone(value: number): DeltaTone {
    if (value > 0) return 'positive'
    if (value < 0) return 'negative'
    return 'neutral'
}
