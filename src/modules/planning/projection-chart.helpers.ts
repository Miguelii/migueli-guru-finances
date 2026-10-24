import type { ChartConfig } from '@/components/ui/chart'
import { formatCurrency, formatMonthLong } from '@/lib/portfolio/formaters'
import { Currency } from '@/types/core/Currency'
import { formatMonthlyContribution, type Scenario } from '@/modules/planning/planning-card.helpers'

export type ScenarioChartRow = { month: string } & Record<string, number | string>

export function getScenarioChartConfig(scenarios: Scenario[]): ChartConfig {
    return Object.fromEntries(
        scenarios.map((scenario) => [
            scenario.key,
            {
                label: formatMonthlyContribution(scenario.monthlyContributionEur),
                color: scenario.color,
            },
        ])
    )
}

/**
 * Joins the scenarios into one chart row per month, with each scenario's projected
 * value under its `key`.
 *
 * @param scenarios - Scenarios over the same months.
 */
export function toScenarioChartRows(scenarios: Scenario[]): ScenarioChartRow[] {
    const months = scenarios.at(0)?.points ?? []

    return months.map(({ month }, index) => {
        const row: ScenarioChartRow = { month }
        for (const scenario of scenarios) {
            row[scenario.key] = scenario.points[index]?.valueEur ?? 0
        }
        return row
    })
}

/**
 * Builds the screen reader summary of the projection chart: each scenario's value at
 * the end of the projection.
 *
 * @param scenarios - Scenarios over the same months.
 * @param hidePrices - When true, amounts are left out of the summary.
 */
export function getProjectionChartSummary(scenarios: Scenario[], hidePrices: boolean): string {
    const lastMonth = scenarios.at(0)?.points.at(-1)?.month
    if (!lastMonth) return 'No projection available'

    const until = formatMonthLong(lastMonth)
    if (hidePrices) return `Projected portfolio value per monthly amount until ${until}`

    const values = scenarios
        .map(
            (scenario) =>
                `${formatMonthlyContribution(scenario.monthlyContributionEur)}: ${formatCurrency(scenario.points.at(-1)?.valueEur ?? 0, Currency.EUR, 0)}`
        )
        .join(', ')

    return `Projected portfolio value in ${until}. ${values}`
}
