'use client'

import { ResponsiveContainer, Sankey, type SankeyLinkProps, type SankeyNodeProps } from 'recharts'
import { formatCurrency } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import { Currency } from '@/types/core/Currency'
import {
    SANKEY_MARGIN,
    SANKEY_NODE_PADDING,
    SANKEY_NODE_WIDTH,
} from '@/modules/expenses/expenses.constants'
import type {
    ExpensesSankey as ExpensesSankeyData,
    SankeyLinkMeta,
    SankeyNodeMeta,
} from '@/modules/expenses/expenses.helpers'

type Props = {
    sankey: ExpensesSankeyData
    summary: string
    hidePrices: boolean
}

// Recharts clones these elements and adds the layout props (position, size, index)
type FlowNodeProps = Partial<SankeyNodeProps> & {
    nodesMeta: SankeyNodeMeta[]
    hidePrices: boolean
}

type FlowLinkProps = Partial<SankeyLinkProps> & {
    linksMeta: SankeyLinkMeta[]
}

const LABEL_GAP_PX = 8

const FlowNode = ({
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    index = -1,
    nodesMeta,
    hidePrices,
}: FlowNodeProps) => {
    const meta = nodesMeta[index]
    if (!meta) return null

    const labelX = meta.isSource ? x - LABEL_GAP_PX : x + width + LABEL_GAP_PX
    const anchor = meta.isSource ? 'end' : 'start'
    const centerY = y + height / 2

    return (
        <g>
            <rect x={x} y={y} width={width} height={Math.max(height, 2)} fill={meta.color} rx={2} />
            <text
                x={labelX}
                y={centerY - 3}
                textAnchor={anchor}
                className="fill-foreground text-xs font-medium"
                stroke="var(--color-card)"
                strokeWidth={4}
                paintOrder="stroke"
            >
                {meta.name}
            </text>
            <text
                x={labelX}
                y={centerY + 11}
                textAnchor={anchor}
                className={cn('fill-muted-foreground text-[11px] tabular-nums', {
                    'blur-sm': hidePrices,
                })}
                stroke="var(--color-card)"
                strokeWidth={4}
                paintOrder="stroke"
            >
                {formatCurrency(meta.valueEur, Currency.EUR, 0)}
            </text>
        </g>
    )
}

const FlowLink = ({
    sourceX,
    sourceY,
    sourceControlX,
    targetX,
    targetY,
    targetControlX,
    linkWidth = 0,
    index = -1,
    linksMeta,
}: FlowLinkProps) => (
    <path
        d={`M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
        fill="none"
        stroke={linksMeta[index]?.color}
        strokeOpacity={0.3}
        strokeWidth={Math.max(linkWidth, 1)}
    />
)

export function ExpensesSankey({ sankey, summary, hidePrices }: Props) {
    return (
        // The flow needs width to stay readable: on a phone it scrolls sideways inside the card
        <div className="-mx-4 overflow-x-auto overscroll-x-contain px-4">
            <figure className="m-0 min-w-160" role="img" aria-label={summary}>
                <ResponsiveContainer width="100%" height={sankey.heightPx}>
                    <Sankey
                        data={{ nodes: sankey.nodes, links: sankey.links }}
                        nodeWidth={SANKEY_NODE_WIDTH}
                        nodePadding={SANKEY_NODE_PADDING}
                        margin={SANKEY_MARGIN}
                        sort={false}
                        node={<FlowNode nodesMeta={sankey.nodes} hidePrices={hidePrices} />}
                        link={<FlowLink linksMeta={sankey.links} />}
                    />
                </ResponsiveContainer>
            </figure>
        </div>
    )
}
