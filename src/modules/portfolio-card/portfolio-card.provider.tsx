'use client'

import { createContext, type PropsWithChildren, useMemo, useState } from 'react'
import {
    PORTFOLIO_CARD_DISCLOSURE_COOKIE,
    PORTFOLIO_CARD_DISCLOSURE_COOKIE_MAX_AGE,
    type PortfolioCardId,
} from '@/modules/portfolio-card/portfolio-card.constants'
import { serializePortfolioCardState } from '@/modules/portfolio-card/portfolio-card.helpers'

type PortfolioCardContextValue = {
    state: Record<PortfolioCardId, boolean>
    toggle: (cardId: PortfolioCardId) => void
}

export const PortfolioCardContext = createContext<PortfolioCardContextValue | null>(null)

type ProviderProps = PropsWithChildren<{
    initialState: Record<PortfolioCardId, boolean>
}>

export function PortfolioCardProvider({ initialState, children }: ProviderProps) {
    const [state, setState] = useState(initialState)

    const contextValue = useMemo(() => {
        const toggle = (cardId: PortfolioCardId) => {
            const nextState = { ...state, [cardId]: !state[cardId] }
            setState(nextState)
            document.cookie = `${PORTFOLIO_CARD_DISCLOSURE_COOKIE}=${encodeURIComponent(serializePortfolioCardState(nextState))}; path=/; max-age=${PORTFOLIO_CARD_DISCLOSURE_COOKIE_MAX_AGE}`
        }

        return { state, toggle }
    }, [state])

    return <PortfolioCardContext value={contextValue}>{children}</PortfolioCardContext>
}
