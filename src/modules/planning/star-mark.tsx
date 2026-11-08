import { StarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
    isEarned: boolean
    className?: string
}

export function StarMark({ isEarned, className }: Props) {
    return (
        <StarIcon
            aria-hidden="true"
            className={cn(
                'size-4 shrink-0 transition-[color,fill,scale] duration-200 ease-out motion-reduce:transition-none',
                {
                    'scale-110 fill-warning text-warning': isEarned,
                    'text-muted-foreground': !isEarned,
                },
                className
            )}
        />
    )
}
