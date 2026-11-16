import { formatCurrency } from '@/lib/portfolio/formaters'
import { Currency } from '@/types/core/Currency'
import { MILESTONES, SCENARIOS } from '@/modules/planning/planning-card.constants'

const MONTHS_PER_YEAR = 12

export type ProjectionPoint = {
    /** Month key in `YYYY-MM` format */
    month: string
    valueEur: number
    investedEur: number
}

type ProjectionInput = {
    startValueEur: number
    startInvestedEur: number
    monthlyContributionEur: number
    annualRate: number
    months: number
    now?: Date
}

export type Milestone = {
    offset: number
    label: string
    /** Chart marker label, e.g. `+1y` */
    shortLabel: string
    month: string
    valueEur: number
    investedEur: number
    /** Contributions added since today */
    depositsEur: number
    /** Value gained since today on top of the contributions */
    growthEur: number
    /** Change of the value since today, in percent */
    changePct: number
}

type ScenarioDefinition = (typeof SCENARIOS)[number]

export type Scenario = {
    /** Chart data key, e.g. `contribution1250` */
    key: string
    monthlyContributionEur: number
    color: string
    swatchClassName: string
    strokeDasharray: string | undefined
    points: ProjectionPoint[]
    milestones: ScenarioMilestone[]
}

export type ScenarioMilestone = Milestone & {
    /** Value above the first (base) scenario at the same milestone */
    differenceEur: number
}

export function formatMonthlyContribution(amountEur: number): string {
    return `${formatCurrency(amountEur, Currency.EUR, 0)} / month`
}

export function toMonthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Projects the portfolio month by month: point 0 is today, then each month the
 * contribution is added at the start and the whole value grows at the monthly
 * equivalent of `annualRate` (compounded, before taxes).
 *
 * @param input.startValueEur - Today's market value.
 * @param input.startInvestedEur - Today's invested capital (cost basis).
 * @param input.monthlyContributionEur - Amount added every month.
 * @param input.annualRate - Yearly rate (`0.08` = 8%).
 * @param input.months - Number of months after today.
 * @param input.now - Reference date for the month keys (defaults to the current date).
 */
export function buildProjection({
    startValueEur,
    startInvestedEur,
    monthlyContributionEur,
    annualRate,
    months,
    now = new Date(),
}: ProjectionInput): ProjectionPoint[] {
    const monthlyRate = (1 + annualRate) ** (1 / MONTHS_PER_YEAR) - 1
    const points: ProjectionPoint[] = []
    let valueEur = startValueEur
    let investedEur = startInvestedEur

    for (let offset = 0; offset <= months; offset++) {
        if (offset > 0) {
            valueEur = (valueEur + monthlyContributionEur) * (1 + monthlyRate)
            investedEur += monthlyContributionEur
        }

        const month = toMonthKey(new Date(now.getFullYear(), now.getMonth() + offset, 1))
        points.push({ month, valueEur, investedEur })
    }

    return points
}

/**
 * Picks the `MILESTONES` points of a projection and splits what changed since today
 * into contributions and growth.
 *
 * @param points - Projection points, today first.
 */
export function getMilestones(points: ProjectionPoint[]): Milestone[] {
    const start = points.at(0)
    if (!start) return []

    return MILESTONES.flatMap(({ offset, label, shortLabel }) => {
        const point = points[offset]
        if (!point) return []

        const depositsEur = point.investedEur - start.investedEur
        const growthEur = point.valueEur - start.valueEur - depositsEur
        const changePct = start.valueEur > 0 ? (point.valueEur / start.valueEur - 1) * 100 : 0

        return [{ offset, label, shortLabel, ...point, depositsEur, growthEur, changePct }]
    })
}

/**
 * Builds one projection per monthly amount in `SCENARIOS`, from the same starting point
 * and rate, and how much more each one has than the first at every milestone.
 *
 * @param input - Projection input without the monthly contribution.
 * @param scenarios - Monthly amounts and their chart styles (defaults to `SCENARIOS`).
 */
export function buildScenarios(
    input: Omit<ProjectionInput, 'monthlyContributionEur'>,
    scenarios: readonly ScenarioDefinition[] = SCENARIOS
): Scenario[] {
    const projected = scenarios.map((scenario) => {
        const points = buildProjection({
            ...input,
            monthlyContributionEur: scenario.monthlyContributionEur,
        })

        return {
            ...scenario,
            key: `contribution${scenario.monthlyContributionEur}`,
            points,
            milestones: getMilestones(points),
        }
    })

    const baseMilestones = projected.at(0)?.milestones ?? []

    return projected.map((scenario) => ({
        ...scenario,
        milestones: scenario.milestones.map((milestone, index) => ({
            ...milestone,
            differenceEur: milestone.valueEur - (baseMilestones[index]?.valueEur ?? 0),
        })),
    }))
}
