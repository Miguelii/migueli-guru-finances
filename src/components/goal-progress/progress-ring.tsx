import {
    PROGRESS_RING_RADIUS,
    PROGRESS_RING_STROKE,
} from '@/components/goal-progress/goal-progress.constants'
import { getRingDashOffset } from '@/components/goal-progress/goal-progress.helpers'
import { cn } from '@/lib/utils'

type Props = {
    /** Progress in percent, clamped to 0-100 */
    percentage: number
    label: string
    isComplete: boolean
}

export function ProgressRing({ percentage, label, isComplete }: Props) {
    const size = (PROGRESS_RING_RADIUS + PROGRESS_RING_STROKE) * 2
    const center = size / 2
    const circumference = 2 * Math.PI * PROGRESS_RING_RADIUS

    return (
        <div
            role="progressbar"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(percentage)}
            className="relative grid size-20 shrink-0 place-items-center"
        >
            <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 size-full -rotate-90">
                <circle
                    cx={center}
                    cy={center}
                    r={PROGRESS_RING_RADIUS}
                    fill="none"
                    strokeWidth={PROGRESS_RING_STROKE}
                    className="stroke-muted"
                />
                <circle
                    cx={center}
                    cy={center}
                    r={PROGRESS_RING_RADIUS}
                    fill="none"
                    strokeWidth={PROGRESS_RING_STROKE}
                    strokeDasharray={circumference}
                    strokeDashoffset={getRingDashOffset(percentage, circumference)}
                    className={cn(
                        'transition-[stroke-dashoffset] duration-500 ease-out motion-reduce:transition-none',
                        {
                            'stroke-success': isComplete,
                            'stroke-foreground': !isComplete,
                        }
                    )}
                />
            </svg>
            <span className="text-sm font-semibold tabular-nums">{percentage.toFixed(0)}%</span>
        </div>
    )
}
