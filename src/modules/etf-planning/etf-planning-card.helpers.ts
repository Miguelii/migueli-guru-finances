import { FALLBACK_ASSET_COLOR } from '@/lib/constants/asset-types'
import type { HoldingSummary } from '@/types/Holding'
import { TickerType } from '@/types/core/TickerType'
import {
    BALANCED_TOLERANCE_PCT,
    MIN_BUY_EUR,
    TARGET_TOTAL_PCT,
} from '@/modules/etf-planning/etf-planning-card.constants'

export type EtfTargets = Record<string, number>

export type EtfPlanRow = {
    holding: HoldingSummary
    currentEur: number
    currentPct: number
    targetPct: number
    driftPct: number
    isHeld: boolean
    unitPriceEur: number
    buyToBalanceEur: number
    buyWithContributionEur: number
}

export type DriftStatus = 'on-target' | 'under' | 'over'

export type AllocationSegment = {
    tickerId: string
    color: string
    pct: number
}

export type EtfPlan = {
    rows: EtfPlanRow[]
    totalEur: number
    targetsSumPct: number
    minBuyToBalanceEur: number
    contributionEur: number
    isBalanced: boolean
    untargetedHeld: HoldingSummary[]
}

/**
 * ETFs to plan: open positions plus targeted ETFs not held yet (never bought or sold out),
 * highest value first.
 * @param holdings - All holding summaries.
 * @param unheldHoldings - Zero-quantity holdings of the assets never bought.
 * @param targets - Target % per `ticker_id`.
 */
export function getEtfPositions(
    holdings: HoldingSummary[],
    unheldHoldings: HoldingSummary[],
    targets: EtfTargets
): HoldingSummary[] {
    return [...holdings, ...unheldHoldings]
        .filter(
            (holding) =>
                holding.tickerType === TickerType.Etf &&
                (holding.total_quantity > 0 || (targets[holding.ticker_id] ?? 0) > 0)
        )
        .toSorted((a, b) => b.current_value_eur - a.current_value_eur)
}

/**
 * Target % input values per planned ETF, `'0'` for the ETFs missing from the targets.
 * @param positions - ETFs from `getEtfPositions`.
 * @param targets - Target % per `ticker_id` (e.g. `ETF_TARGET_ALLOCATION`).
 */
export function getInitialTargetInputs(
    positions: HoldingSummary[],
    targets: EtfTargets
): Record<string, string> {
    return Object.fromEntries(
        positions.map((holding) => [holding.ticker_id, String(targets[holding.ticker_id] ?? 0)])
    )
}

/**
 * Parses a % input (accepts `,` as decimal separator), clamped to 0-100. Invalid input is 0.
 * @param value - Raw input value.
 */
export function parsePercentInput(value: string): number {
    const parsed = Number(value.replace(',', '.'))

    if (!Number.isFinite(parsed)) return 0

    return Math.min(Math.max(parsed, 0), TARGET_TOTAL_PCT)
}

/**
 * Parses a EUR amount input (accepts `,` as decimal separator). Invalid or negative input is 0.
 * @param value - Raw input value.
 */
export function parseTargetInputs(inputs: Record<string, string>): EtfTargets {
    return Object.fromEntries(
        Object.entries(inputs).map(([tickerId, value]) => [tickerId, parsePercentInput(value)])
    )
}

/**
 * Splits `amount` across the targeted ETFs without selling: the ETFs furthest below their
 * target are filled first, all towards the same level, so the buys always add up to `amount`.
 * @param items - Current EUR value and normalised target weight (sums to 1) per ETF.
 * @param amount - EUR to invest.
 */
function fillTowardsTarget(items: { valueEur: number; weight: number }[], amount: number) {
    const sorted = items
        .map((item, index) => ({ ...item, index, ratio: item.valueEur / item.weight }))
        .toSorted((a, b) => a.ratio - b.ratio)

    let level = 0
    let valueSum = 0
    let weightSum = 0

    for (const [position, item] of sorted.entries()) {
        valueSum += item.valueEur
        weightSum += item.weight
        level = (amount + valueSum) / weightSum

        if (level <= (sorted[position + 1]?.ratio ?? Infinity)) break
    }

    return items.map((item) => Math.max(0, item.weight * level - item.valueEur))
}

/**
 * Buy-only rebalancing plan for the ETF positions. Targets are normalised by their sum, so the
 * plan still works while the inputs don't add up to 100. ETFs not held yet start at 0 € and are
 * filled first. ETFs held with a 0% target can only be fixed by selling, so they never get buys
 * and are listed in `untargetedHeld`.
 * @param positions - ETFs from `getEtfPositions` (EUR values already converted).
 * @param targets - Target % per `ticker_id`.
 * @param contributionEur - Optional amount about to be invested.
 */
export function getEtfPlan(
    positions: HoldingSummary[],
    targets: EtfTargets,
    contributionEur: number
): EtfPlan {
    const totalEur = positions.reduce((sum, holding) => sum + holding.current_value_eur, 0)
    const targetsSumPct = positions.reduce(
        (sum, holding) => sum + (targets[holding.ticker_id] ?? 0),
        0
    )

    const weightOf = (holding: HoldingSummary) =>
        targetsSumPct > 0 ? (targets[holding.ticker_id] ?? 0) / targetsSumPct : 0

    const targeted = positions
        .filter((holding) => weightOf(holding) > 0)
        .map((holding) => ({
            tickerId: holding.ticker_id,
            valueEur: holding.current_value_eur,
            weight: weightOf(holding),
        }))

    // Without selling, the most overweight ETF sets the portfolio size where every weight matches
    const balancedTotalEur = Math.max(0, ...targeted.map((item) => item.valueEur / item.weight))
    const contributionBuys = fillTowardsTarget(targeted, contributionEur)

    const buyToBalance = new Map(
        targeted.map((item) => [item.tickerId, item.weight * balancedTotalEur - item.valueEur])
    )
    const buyWithContribution = new Map(
        targeted.map((item, index) => [item.tickerId, contributionBuys[index]])
    )

    const rows = positions.map((holding) => {
        const currentPct = totalEur > 0 ? (holding.current_value_eur / totalEur) * 100 : 0

        return {
            holding,
            currentEur: holding.current_value_eur,
            currentPct,
            targetPct: targets[holding.ticker_id] ?? 0,
            driftPct: currentPct - weightOf(holding) * 100,
            isHeld: holding.total_quantity > 0,
            unitPriceEur: holding.current_price_eur,
            buyToBalanceEur: buyToBalance.get(holding.ticker_id) ?? 0,
            buyWithContributionEur: buyWithContribution.get(holding.ticker_id) ?? 0,
        }
    })

    const untargetedHeld = positions.filter(
        (holding) => holding.total_quantity > 0 && weightOf(holding) === 0
    )

    return {
        rows,
        totalEur,
        targetsSumPct,
        minBuyToBalanceEur: rows.reduce((sum, row) => sum + row.buyToBalanceEur, 0),
        contributionEur,
        isBalanced:
            targeted.length > 0 &&
            untargetedHeld.length === 0 &&
            rows.every((row) => Math.abs(row.driftPct) < BALANCED_TOLERANCE_PCT),
        untargetedHeld,
    }
}

export function isSuggestedBuy(amountEur: number): boolean {
    return amountEur >= MIN_BUY_EUR
}

export function toUnits(amountEur: number, unitPriceEur: number): number {
    return unitPriceEur > 0 ? amountEur / unitPriceEur : 0
}

/**
 * Normalised target split of the targeted ETFs in row order (e.g. `'60/40'`).
 * @param plan - Plan from `getEtfPlan`.
 */
export function getTargetSplitLabel(plan: EtfPlan): string {
    if (plan.targetsSumPct <= 0) return ''

    return plan.rows
        .filter((row) => row.targetPct > 0)
        .map((row) => Math.round((row.targetPct / plan.targetsSumPct) * 100))
        .join('/')
}

export function getDriftStatus(driftPct: number): DriftStatus {
    if (Math.abs(driftPct) < BALANCED_TOLERANCE_PCT) return 'on-target'

    return driftPct < 0 ? 'under' : 'over'
}

/**
 * Signed drift in percentage points with one decimal (e.g. `'+10.0 pp'`, `'-2.5 pp'`).
 * @param driftPct - Current % minus target %.
 */
export function formatDrift(driftPct: number): string {
    const sign = driftPct > 0 ? '+' : ''

    return `${sign}${driftPct.toFixed(1)} pp`
}

/**
 * Stacked bar segments of the current or the (normalised) target split, ETFs at 0% left out.
 * @param plan - Plan from `getEtfPlan`.
 * @param split - Which split to draw.
 */
export function getAllocationSegments(
    plan: EtfPlan,
    split: 'current' | 'target'
): AllocationSegment[] {
    return plan.rows.flatMap((row) => {
        const pct =
            split === 'current'
                ? row.currentPct
                : plan.targetsSumPct > 0
                  ? (row.targetPct / plan.targetsSumPct) * 100
                  : 0

        if (pct <= 0) return []

        return [
            {
                tickerId: row.holding.ticker_id,
                color: row.holding.tickerHexColor ?? FALLBACK_ASSET_COLOR,
                pct,
            },
        ]
    })
}
