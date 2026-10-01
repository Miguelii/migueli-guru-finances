import type { TaxTimelineStep } from '@/lib/portfolio/capital-gains-tax'
import { formatDate } from '@/lib/portfolio/formaters'

/**
 * Period covered by a tax bracket: "until 17 mar. 2028" for the first one, "from 17 mar.
 * 2034" for the last one, otherwise "17 mar. 2028 to 17 mar. 2031".
 * @param step - Bracket of the `getCapitalGainsTax` timeline.
 * @param isFirst - Whether it is the bracket starting at the purchase date.
 */
export function getTaxStepPeriod(step: TaxTimelineStep, isFirst: boolean): string {
    if (step.until === null) return `from ${formatDate(step.from.toISOString())}`

    if (isFirst) return `until ${formatDate(step.until.toISOString())}`

    return `${formatDate(step.from.toISOString())} to ${formatDate(step.until.toISOString())}`
}

export function isPastTaxStep(step: TaxTimelineStep, now = new Date()): boolean {
    return step.until !== null && step.until <= now
}
