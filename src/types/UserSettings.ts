import type { Expense } from '@/types/Expense'

// `null` while the user has not saved the value on the Settings page
export type UserSettings = {
    netMonthlySalaryEur: number | null
    emergencyFundGoalEur: number | null
    monthlyExpenses: Expense[]
}
