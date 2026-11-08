'use client'

import { useQueryState } from 'nuqs'
import { useState } from 'react'
import { housePriceParser, paramsUrlKeys } from '@/lib/core/searchParams'
import { parseAmountInput } from '@/lib/utils'
import { AssumptionsPanel } from '@/modules/planning/assumptions-panel'
import { HouseDetail } from '@/modules/planning/house-detail'
import { HouseLevelPicker } from '@/modules/planning/house-level-picker'
import { getAffordability, getPaymentFactor } from '@/modules/planning/house-loan.helpers'
import {
    DEFAULT_ANNUAL_RATE_PCT,
    DEFAULT_TERM_YEARS,
    HOUSE_PRICES_EUR,
} from '@/modules/planning/house-planner-card.constants'
import {
    buildHousePlans,
    getGaugeMaxEur,
    getInitialHouseInputs,
    getNextStar,
    getSelectedPlan,
    type HouseInputs,
} from '@/modules/planning/house-planner-card.helpers'
import { NextStarBanner } from '@/modules/planning/next-star-banner'

type Props = {
    portfolioValueEur: number
    hidePrices: boolean
}

export function HousePlannerCard({ portfolioValueEur, hidePrices }: Props) {
    const [inputs, setInputs] = useState(() => getInitialHouseInputs(portfolioValueEur))
    const [selectedPriceEur, setSelectedPriceEur] = useQueryState(
        paramsUrlKeys.house_price!,
        housePriceParser.withOptions({ shallow: true })
    )

    const savedEur = parseAmountInput(inputs.saved)
    const monthlySavingEur = parseAmountInput(inputs.monthlySaving)
    const annualRatePct = parseAmountInput(inputs.annualRate) || DEFAULT_ANNUAL_RATE_PCT
    const termYears = parseAmountInput(inputs.term) || DEFAULT_TERM_YEARS
    const loan = { annualRatePct, termYears }

    const plans = buildHousePlans({
        pricesEur: HOUSE_PRICES_EUR,
        savedEur,
        monthlySavingEur,
        loan,
    })
    const nextStar = getNextStar(plans)
    const selectedPlan = getSelectedPlan(plans, selectedPriceEur, nextStar)

    const handleInputChange = (key: keyof HouseInputs, value: string) =>
        setInputs((current) => ({ ...current, [key]: value }))

    return (
        <section aria-label="House planner" className="flex flex-col gap-4">
            <NextStarBanner
                nextStar={nextStar}
                savedEur={savedEur}
                affordability={getAffordability(savedEur, monthlySavingEur, getPaymentFactor(loan))}
                hidePrices={hidePrices}
            />

            <HouseLevelPicker
                plans={plans}
                selectedPriceEur={selectedPlan?.priceEur}
                hidePrices={hidePrices}
                onSelect={setSelectedPriceEur}
            />

            {selectedPlan && (
                <HouseDetail
                    plan={selectedPlan}
                    gaugeMaxEur={getGaugeMaxEur(plans)}
                    hidePrices={hidePrices}
                />
            )}

            <AssumptionsPanel
                inputs={inputs}
                savedEur={savedEur}
                monthlySavingEur={monthlySavingEur}
                annualRatePct={annualRatePct}
                termYears={termYears}
                hidePrices={hidePrices}
                onChange={handleInputChange}
                onReset={() => setInputs(getInitialHouseInputs(portfolioValueEur))}
            />

            <p className="max-w-prose text-xs text-muted-foreground">
                Estimates with the rate fixed for the whole term and no investment growth on your
                savings. IMT, stamp duty, notary fees and life and home insurance are not included,
                so budget extra cash and a higher monthly cost for them.
            </p>
        </section>
    )
}
