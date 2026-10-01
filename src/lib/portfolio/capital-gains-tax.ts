import { TickerType, TransactionType, type Transaction } from '@/types/Transaction'

type TaxBracket = {
    /** Holding period (in whole years since the BUY) from which the rate applies */
    fromYears: number
    rate: number
}

export type TaxTimelineStep = {
    rate: number
    from: Date
    /** `null` for the last bracket (applies forever) */
    until: Date | null
    isCurrent: boolean
}

export type CapitalGainsTax = {
    rate: number
    next: { rate: number; date: Date } | null
    timeline: TaxTimelineStep[]
}

const STOCKS_AND_ETFS_BRACKETS: TaxBracket[] = [
    { fromYears: 0, rate: 0.28 },
    { fromYears: 2, rate: 0.252 },
    { fromYears: 5, rate: 0.224 },
    { fromYears: 8, rate: 0.196 },
]

// Portuguese capital gains rules per asset type, applied to each BUY (lot) on its own
const CAPITAL_GAINS_BRACKETS: Partial<Record<TickerType, TaxBracket[]>> = {
    // Crypto held for over 1 year is exempt
    [TickerType.Crypto]: [
        { fromYears: 0, rate: 0.28 },
        { fromYears: 1, rate: 0 },
    ],
    [TickerType.Etf]: STOCKS_AND_ETFS_BRACKETS,
    [TickerType.Stock]: STOCKS_AND_ETFS_BRACKETS,
}

function addYears(date: Date, years: number): Date {
    const result = new Date(date)
    result.setFullYear(result.getFullYear() + years)
    return result
}

/**
 * Capital gains tax rate of a BUY today, the next (lower) rate and when it starts, and the
 * full bracket timeline from the purchase date. `null` for non-BUY transactions and asset
 * types without a rule (e.g. FX).
 * @param tx - Transaction to evaluate.
 * @param assetType - Asset type of the transaction's ticker.
 * @param now - Reference time (defaults to now).
 */
export function getCapitalGainsTax(
    tx: Transaction,
    assetType?: TickerType,
    now = new Date()
): CapitalGainsTax | null {
    const brackets = assetType ? CAPITAL_GAINS_BRACKETS[assetType] : undefined

    if (!brackets || tx.type !== TransactionType.Buy) return null

    const buyDate = new Date(tx.buy_date.replace(' ', 'T'))

    const timeline = brackets.map((bracket, index) => {
        const from = addYears(buyDate, bracket.fromYears)
        const nextBracket = brackets[index + 1]
        const until = nextBracket ? addYears(buyDate, nextBracket.fromYears) : null

        return {
            rate: bracket.rate,
            from,
            until,
            isCurrent: from <= now && (until === null || now < until),
        }
    })

    const currentIndex = Math.max(
        timeline.findIndex((step) => step.isCurrent),
        0
    )
    const nextStep = timeline[currentIndex + 1]

    return {
        rate: timeline[currentIndex]!.rate,
        next: nextStep ? { rate: nextStep.rate, date: nextStep.from } : null,
        timeline,
    }
}

/**
 * Tax rate as a short percentage: `0.28` → "28%", `0.252` → "25.2%".
 * @param rate - Rate between 0 and 1.
 */
export function formatTaxRate(rate: number): string {
    return `${Number((rate * 100).toFixed(1))}%`
}
