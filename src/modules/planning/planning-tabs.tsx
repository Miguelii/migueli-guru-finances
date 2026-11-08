'use client'

import type { ReactNode } from 'react'
import { HouseIcon, TrendingUpIcon } from 'lucide-react'
import { useQueryState } from 'nuqs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { PlanningTab } from '@/lib/constants/planning'
import { paramsUrlKeys, planningTabParser } from '@/lib/core/searchParams'

type Props = {
    house: ReactNode
    projection: ReactNode
}

export function PlanningTabs({ house, projection }: Props) {
    const [tab, setTab] = useQueryState(
        paramsUrlKeys.planning_tab!,
        planningTabParser.withOptions({ shallow: true })
    )

    return (
        <Tabs
            value={tab}
            onValueChange={(value: PlanningTab) => setTab(value)}
            className="min-w-0 gap-4"
        >
            <TabsList>
                <TabsTrigger value="house" className="px-3">
                    <HouseIcon aria-hidden="true" />
                    House
                </TabsTrigger>
                <TabsTrigger value="projection" className="px-3">
                    <TrendingUpIcon aria-hidden="true" />
                    Projection
                </TabsTrigger>
            </TabsList>
            {/* Stays mounted so the assumptions are not lost when switching tabs */}
            <TabsContent value="house" keepMounted>
                {house}
            </TabsContent>
            <TabsContent value="projection">{projection}</TabsContent>
        </Tabs>
    )
}
