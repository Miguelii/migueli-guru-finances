export enum ExpenseCategory {
    Housing = 'HOUSING',
    Food = 'FOOD',
    Transport = 'TRANSPORT',
    Car = 'CAR',
    Bills = 'BILLS',
    Health = 'HEALTH',
    Leisure = 'LEISURE',
    Saving = 'SAVING',
    VacationFund = 'VACATION_FUND',
    Investment = 'INVESTMENT',
    GeneralExpenses = 'GENERAL_EXPENSES',
    Other = 'OTHER',
}

// One recurring monthly expense, stored in `user_settings.monthly_expenses`
export type Expense = {
    id: string
    name: string
    amountEur: number
    category: ExpenseCategory
}
