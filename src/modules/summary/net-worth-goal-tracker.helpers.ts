type NetWorthGoalProgress = {
    percentage: number
    remaining: number
    isComplete: boolean
}

export function getNetWorthGoalProgress(currentValue: number, goal: number): NetWorthGoalProgress {
    const percentage = goal > 0 ? Math.min(Math.max((currentValue / goal) * 100, 0), 100) : 0

    return {
        percentage,
        remaining: Math.max(goal - currentValue, 0),
        isComplete: currentValue >= goal,
    }
}
