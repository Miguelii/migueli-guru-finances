import {
    DEFAULT_PORTFOLIO_CARD_STATE,
    PORTFOLIO_CARD_IDS,
    type PortfolioCardId,
} from '@/modules/portfolio-card/portfolio-card.constants'
import { Effect, Schema } from 'effect'

const portfolioCardStateSchema = Schema.Record({ key: Schema.String, value: Schema.Unknown })

export function parsePortfolioCardState(value?: string): Record<PortfolioCardId, boolean> {
    const fallback = Effect.succeed({ ...DEFAULT_PORTFOLIO_CARD_STATE })

    if (value == null) return Effect.runSync(fallback)

    const parsedState = Effect.gen(function* () {
        const decodedValue = yield* Effect.try({
            try: () => decodeURIComponent(value),
            catch: () => new Error('Invalid portfolio card cookie encoding'),
        })
        const jsonValue = yield* Effect.try({
            try: () => JSON.parse(decodedValue),
            catch: () => new Error('Invalid portfolio card cookie JSON'),
        })
        const state = yield* Schema.decodeUnknown(portfolioCardStateSchema)(jsonValue)

        return PORTFOLIO_CARD_IDS.reduce(
            (nextState, cardId) => {
                const cardValue = state[cardId]
                nextState[cardId] =
                    typeof cardValue === 'boolean'
                        ? cardValue
                        : DEFAULT_PORTFOLIO_CARD_STATE[cardId]
                return nextState
            },
            { ...DEFAULT_PORTFOLIO_CARD_STATE }
        )
    })

    return Effect.runSync(parsedState.pipe(Effect.orElse(() => fallback)))
}

export function serializePortfolioCardState(state: Record<PortfolioCardId, boolean>) {
    return Effect.runSync(
        Effect.sync(() =>
            JSON.stringify(
                Object.fromEntries(PORTFOLIO_CARD_IDS.map((cardId) => [cardId, state[cardId]]))
            )
        )
    )
}
