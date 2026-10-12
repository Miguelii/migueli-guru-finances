import { z } from 'zod'

export const newsTickersSchema = z.object({
    tickers: z
        .array(
            z
                .string()
                .trim()
                .min(1)
                .max(15)
                .regex(/^[A-Z0-9.\-=]+$/u)
        )
        .max(50),
})

export type NewsTickersProps = z.infer<typeof newsTickersSchema>
