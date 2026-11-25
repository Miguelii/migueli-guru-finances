import { z } from 'zod'

export const createPayslipSchema = z.object({
    year: z.number().int().min(2000).max(2100),
    month: z.number().int().min(1).max(12),
    net_salary: z.number().nonnegative(),
    meal_allowance: z.number().nonnegative(),
    note: z.string().trim().max(60).optional(),
})

export const updatePayslipSchema = createPayslipSchema.extend({
    id: z.string().min(1),
})

export const deletePayslipSchema = z.object({
    id: z.string().min(1),
})

export type CreatePayslipProps = z.infer<typeof createPayslipSchema>
export type UpdatePayslipProps = z.infer<typeof updatePayslipSchema>
