import { describe, expect, it } from 'vitest'
import { ExpenseCategory } from '@/types/Expense'
import { toUserSettings } from '@/_bff/modules/settings/helpers/to-user-settings.helper'
import { storedExpensesSchema } from '@/_bff/modules/settings/settings.dto'

const RENT = { id: 'a', name: 'Rent', amountEur: 750, category: ExpenseCategory.Housing }

describe('toUserSettings', () => {
    it('returns unset values without a stored row', () => {
        expect(toUserSettings(null)).toEqual({
            netMonthlySalaryEur: null,
            emergencyFundGoalEur: null,
            monthlyExpenses: [],
        })
    })

    it('reads the stored values, including numeric strings and null columns', () => {
        expect(
            toUserSettings({
                user_id: 'user',
                net_monthly_salary_eur: '2577.2',
                emergency_fund_goal_eur: null,
                monthly_expenses: [RENT],
                updated_at: '',
            })
        ).toEqual({
            netMonthlySalaryEur: 2577.2,
            emergencyFundGoalEur: null,
            monthlyExpenses: [RENT],
        })
    })
})

describe('storedExpensesSchema', () => {
    it('drops items with an unexpected shape', () => {
        expect(
            storedExpensesSchema.parse([
                RENT,
                { id: 'b', name: 'Gym', amountEur: -5, category: ExpenseCategory.Health },
                { name: 'No id', amountEur: 10, category: ExpenseCategory.Other },
                'garbage',
            ])
        ).toEqual([RENT])
    })

    it('returns an empty list for anything but an array', () => {
        expect(storedExpensesSchema.parse(null)).toEqual([])
        expect(storedExpensesSchema.parse({})).toEqual([])
    })
})
