import { BALANCE_TYPE_PRIORITY } from '@/_bff/modules/bank/bank.constants'

type RawBalance = {
    balance_type: string
    balance_amount: { amount: string; currency: string }
}

type PickedBalance = {
    amount: number
    currency: string
}

function isNumericAmount(amount: string): boolean {
    return amount.trim() !== '' && Number.isFinite(Number(amount))
}

/**
 * Picks the most current balance from a PSD2 balances list, following
 * `BALANCE_TYPE_PRIORITY` and falling back to the first entry with a numeric amount.
 * Returns `null` when no usable balance exists.
 *
 * @param balances - Balances as returned by Enable Banking (`amount` is a decimal string)
 */
export function pickBalance(balances: RawBalance[]): PickedBalance | null {
    const usable = balances.filter(({ balance_amount }) => isNumericAmount(balance_amount.amount))

    const preferred = BALANCE_TYPE_PRIORITY.map((type) =>
        usable.find(({ balance_type }) => balance_type === type)
    ).find(Boolean)

    const picked = preferred ?? usable[0]

    if (!picked) return null

    return {
        amount: Number(picked.balance_amount.amount),
        currency: picked.balance_amount.currency,
    }
}
