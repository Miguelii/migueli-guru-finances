import { formatDate } from '@/lib/formaters'
import { type Transaction, type TickerData, TickerType, TransactionType } from '@/types/Transaction'

type SellEligibility = {
    canSell: boolean
    unlockDate: Date
}

/**
 * Portuguese tax rule: crypto held for over 1 year is exempt from capital gains tax.
 * @returns `null` for non-crypto assets and non-BUY transactions, otherwise whether the
 * 1-year holding period has passed and the date it does.
 */
export function getSellEligibility(
    tx: Transaction,
    assetType: TickerData['type'] | undefined
): SellEligibility | null {
    if (assetType !== TickerType.Crypto || tx.type !== TransactionType.Buy) return null
    const unlockDate = new Date(tx.buy_date.replace(' ', 'T'))
    unlockDate.setFullYear(unlockDate.getFullYear() + 1)
    return { canSell: unlockDate <= new Date(), unlockDate }
}

/**
 * Formats the time remaining from now until `date` as pt-PT UI copy,
 * e.g. "2 meses e 4 dias", "1 mês", "12 dias".
 */
function formatTimeUntil(date: Date): string {
    const now = new Date()
    let months = (date.getFullYear() - now.getFullYear()) * 12 + (date.getMonth() - now.getMonth())
    const dayAnchor = new Date(now)
    dayAnchor.setMonth(dayAnchor.getMonth() + months)
    if (dayAnchor > date) {
        months -= 1
        dayAnchor.setMonth(dayAnchor.getMonth() - 1)
    }
    const days = Math.ceil((date.getTime() - dayAnchor.getTime()) / (1000 * 60 * 60 * 24))
    const parts: string[] = []
    if (months > 0) parts.push(months === 1 ? '1 mês' : `${months} meses`)
    if (days > 0) parts.push(days === 1 ? '1 dia' : `${days} dias`)
    return parts.join(' e ') || 'hoje'
}

export function getSellEligibilityLabel(sel: SellEligibility | null) {
    if (sel == null) return 'N/A'

    if (sel.canSell) return 'SIM'

    return `${formatDate(sel.unlockDate.toISOString())} (${formatTimeUntil(sel.unlockDate)})`
}
