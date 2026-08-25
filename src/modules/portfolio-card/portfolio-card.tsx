'use client'

import { ChevronDown } from 'lucide-react'
import { motion } from 'motion/react'
import { type PropsWithChildren, use } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type PortfolioCardId } from '@/modules/portfolio-card/portfolio-card.constants'
import { cn } from '@/lib/utils'
import { PortfolioCardContext } from '@/modules/portfolio-card/portfolio-card.provider'

type Props = PropsWithChildren<{
    cardId: PortfolioCardId
    title: string
    className?: string
    openHeightClassName?: string
    actions?: React.ReactNode
    contentClassName?: string
}>

export function PortfolioCard({
    cardId,
    title,
    className,
    openHeightClassName = 'h-112.5',
    actions,
    contentClassName,
    children,
}: Props) {
    const context = use(PortfolioCardContext)
    if (context == null) throw new Error('PortfolioCardDisclosure requires its provider')

    const isOpen = context.state[cardId]
    const contentId = `portfolio-card-content-${cardId}`

    return (
        <Card
            className={cn('w-full shadow-sm', className, {
                [openHeightClassName]: isOpen,
                'pb-0': !isOpen,
            })}
        >
            <CardHeader
                className="flex cursor-pointer flex-row items-center justify-between gap-2"
                role="button"
                tabIndex={0}
                aria-expanded={isOpen}
                aria-controls={contentId}
                onClick={(event) => {
                    if (
                        event.target instanceof Element &&
                        event.target.closest('[data-portfolio-card-actions]') !== null
                    ) {
                        return
                    }

                    context.toggle(cardId)
                }}
                onKeyDown={(event) => {
                    if (
                        event.target instanceof Element &&
                        event.target.closest('[data-portfolio-card-actions]') !== null
                    ) {
                        return
                    }

                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        context.toggle(cardId)
                    }
                }}
            >
                <CardTitle>{title}</CardTitle>
                <div className="flex items-center gap-2" data-portfolio-card-actions>
                    {actions}
                    <ChevronDown
                        aria-hidden="true"
                        className={cn('size-4 transition-transform duration-200', {
                            'rotate-180': isOpen,
                        })}
                    />
                </div>
            </CardHeader>
            <motion.div
                initial={false}
                animate={{
                    height: isOpen ? 'auto' : 0,
                    opacity: isOpen ? 1 : 0,
                    y: isOpen ? 0 : -12,
                }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
                className={cn('min-h-0 overflow-hidden', {
                    'flex-1': isOpen,
                })}
                id={contentId}
                aria-hidden={!isOpen}
            >
                <CardContent className={contentClassName}>{children}</CardContent>
            </motion.div>
        </Card>
    )
}
