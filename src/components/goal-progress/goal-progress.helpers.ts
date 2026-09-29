type GoalProgress = {
    percentage: number
    remaining: number
    isComplete: boolean
}

export function getGoalProgress(currentValue: number, goal: number): GoalProgress {
    const percentage = goal > 0 ? Math.min(Math.max((currentValue / goal) * 100, 0), 100) : 0

    return {
        percentage,
        remaining: Math.max(goal - currentValue, 0),
        isComplete: currentValue >= goal,
    }
}

/**
 * Returns the SVG `stroke-dashoffset` that draws `percentage` of a ring.
 *
 * @param percentage - Progress in percent (clamped to 0-100).
 * @param circumference - Ring circumference in SVG units.
 */
export function getRingDashOffset(percentage: number, circumference: number): number {
    const clamped = Math.min(Math.max(percentage, 0), 100)
    return circumference * (1 - clamped / 100)
}
