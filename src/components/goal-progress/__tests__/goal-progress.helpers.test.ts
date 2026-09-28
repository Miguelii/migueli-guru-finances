import { describe, it, expect } from 'vitest'
import { getGoalProgress } from '@/components/goal-progress/goal-progress.helpers'

describe('getGoalProgress', () => {
    it('should report the percentage and the amount left', () => {
        expect(getGoalProgress(1_250, 5_000)).toEqual({
            percentage: 25,
            remaining: 3_750,
            isComplete: false,
        })
    })

    it('should cap at 100% once the goal is exceeded', () => {
        expect(getGoalProgress(6_000, 5_000)).toEqual({
            percentage: 100,
            remaining: 0,
            isComplete: true,
        })
    })

    it('should not go below 0% for a negative value', () => {
        expect(getGoalProgress(-100, 5_000).percentage).toBe(0)
    })

    it('should be 0% without a positive goal', () => {
        expect(getGoalProgress(1_000, 0).percentage).toBe(0)
    })
})
