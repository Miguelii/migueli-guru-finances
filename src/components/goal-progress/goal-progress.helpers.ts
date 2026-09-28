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
