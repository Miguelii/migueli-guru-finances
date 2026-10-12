type RebuildResult = {
    days: number
    missingHistory: string[]
}

/**
 * Builds the success toast copy of a history rebuild.
 *
 * @param result - Rebuilt day count and the tickers that had no price history.
 */
export function getRebuildToast(result: RebuildResult): { message: string; warning?: string } {
    const message =
        result.days === 0
            ? 'Nothing to rebuild yet: history starts the day after your first transaction'
            : `History rebuilt: ${result.days.toLocaleString('pt-PT')} days`

    if (result.missingHistory.length === 0) return { message }

    return {
        message,
        warning: `No price history for ${result.missingHistory.join(', ')}, valued at the last trade price`,
    }
}
