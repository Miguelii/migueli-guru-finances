import { LOG_RANGES } from '@/lib/constants/logs'
import { z } from 'zod'

export const getLogsSchema = z.object({
    range: z.enum(LOG_RANGES),
    search: z.string().trim().max(200).optional(),
})

export type GetLogsProps = z.infer<typeof getLogsSchema>
