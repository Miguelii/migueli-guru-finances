export type Payslip = {
    id: string
    user_id: string
    year: number
    month: number // 1 = January
    net_salary: number
    meal_allowance: number
    note: string | null
    created_at: string
    updated_at: string
}
