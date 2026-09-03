import { formatCurrency } from '@/lib/formaters'
import type { HoldingSummary } from '@/types/Holding'
import { Currency } from '@/types/Transaction'
import { PORTFOLIO_EXPORT_TYPES } from '@/modules/portfolio-export/portfolio-export.constants'

type PortfolioExportType = (typeof PORTFOLIO_EXPORT_TYPES)[number]

type PortfolioExportRow = {
    symbol: string
    allocation: string
    invested: string
}

function formatExportPercentage(value: number): string {
    return `${value.toLocaleString('pt-PT', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    })}%`
}

function getPercentage(value: number, total: number): number {
    return total > 0 ? (value / total) * 100 : 0
}

export function createPortfolioOverview(holdings: HoldingSummary[]): string {
    const groupedHoldings = new Map<PortfolioExportType, HoldingSummary[]>()

    for (const type of PORTFOLIO_EXPORT_TYPES) {
        groupedHoldings.set(type, [])
    }

    for (const holding of holdings) {
        if (groupedHoldings.has(holding.tickerType as PortfolioExportType)) {
            groupedHoldings.get(holding.tickerType as PortfolioExportType)?.push(holding)
        }
    }

    const supportedHoldings = Array.from(groupedHoldings.values()).flat()
    const totalCurrentValue = supportedHoldings.reduce(
        (sum, holding) => sum + holding.current_value_eur,
        0
    )
    const totalInvested = supportedHoldings.reduce(
        (sum, holding) => sum + holding.total_invested_eur,
        0
    )
    const exportRows = supportedHoldings.map(
        (holding): PortfolioExportRow => ({
            symbol: holding.symbol,
            allocation: `allocation ${formatExportPercentage(getPercentage(holding.total_invested_eur, totalInvested))}`,
            invested: `invested ${formatCurrency(holding.total_invested_eur, Currency.EUR)}`,
        })
    )
    const symbolWidth = Math.max(...exportRows.map((row) => row.symbol.length), 0)
    const allocationWidth = Math.max(...exportRows.map((row) => row.allocation.length), 0)
    const formattedRows = new Map(
        supportedHoldings.map((holding, index) => {
            const row = exportRows[index]
            return [
                holding,
                `${row.symbol.padEnd(symbolWidth)} | ${row.allocation.padEnd(allocationWidth)} | ${row.invested}`,
            ]
        })
    )

    const typeSections = PORTFOLIO_EXPORT_TYPES.flatMap((type) => {
        const typeHoldings = groupedHoldings.get(type) ?? []
        if (typeHoldings.length === 0) return []

        const typeValue = typeHoldings.reduce((sum, holding) => sum + holding.current_value_eur, 0)
        const lines = [
            `${type} - ${formatExportPercentage(getPercentage(typeValue, totalCurrentValue))}`,
            ...typeHoldings.map((holding) => formattedRows.get(holding)),
        ]

        return lines.join('\n')
    })

    if (typeSections.length === 0) return ''

    return `${typeSections.join('\n\n')}\n\nTotal Invested: ${formatCurrency(totalInvested, Currency.EUR)}`
}
