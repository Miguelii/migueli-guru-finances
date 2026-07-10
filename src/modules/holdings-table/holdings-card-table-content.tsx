import { TableBody, TableCell, TableRow } from '@/components/ui/table'
import { formatCurrency, formatQuantity, formatPercentage } from '@/lib/formaters'
import { cn } from '@/lib/utils'
import { Currency } from '@/types/Transaction'
import type { HoldingsCardProps } from '@/modules/holdings-table/holdings-card'
import { LogoAvatar } from '@/components/logo-avatar'

export const HoldingsCardTableContent = ({ holdings, hidePrices }: HoldingsCardProps) => {
    return (
        <TableBody>
            {holdings.map((h) => (
                <TableRow
                    key={h.ticker_id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                >
                    <TableCell className="font-medium">
                        <LogoAvatar
                            tickerLogo={h.tickerLogo}
                            ticker={h.symbol}
                            tickerCurrency={h.currency}
                        />
                    </TableCell>
                    <TableCell
                        className={cn('text-right tabular-nums', {
                            'blur-md select-none': hidePrices,
                        })}
                    >
                        {formatQuantity(h.total_quantity, 10)}
                    </TableCell>
                    <TableCell
                        className={cn('text-right tabular-nums', {
                            'blur-md select-none': hidePrices,
                        })}
                    >
                        {formatCurrency(h.total_invested, h.currency)}
                    </TableCell>
                    <TableCell
                        className={cn('text-right tabular-nums', {
                            'blur-md select-none': hidePrices,
                        })}
                    >
                        {formatCurrency(h.total_fees, h.currency)}
                    </TableCell>
                    <TableCell
                        className={cn('text-right tabular-nums', {
                            'blur-md select-none': hidePrices,
                        })}
                    >
                        {formatCurrency(h.current_value, h.currency)}
                    </TableCell>
                    <TableCell
                        className={cn('text-right tabular-nums', {
                            'blur-md select-none': hidePrices,
                        })}
                    >
                        {formatCurrency(h.avg_cost_per_share, h.currency, 5)}
                    </TableCell>
                    <TableCell
                        className={cn('text-right tabular-nums', {
                            'text-success': h.realized_gl_eur > 0,
                            'text-destructive': h.realized_gl_eur < 0,
                            'text-muted-foreground': h.realized_gl_eur == 0,
                            'blur-md select-none': hidePrices,
                        })}
                    >
                        {formatCurrency(h.realized_gl_eur, Currency.EUR)}
                    </TableCell>
                    <TableCell
                        className={cn('text-right tabular-nums', {
                            'text-success': h.unrealized_gl_eur > 0,
                            'text-destructive': h.unrealized_gl_eur < 0,
                            'text-muted-foreground': h.unrealized_gl_eur == 0,
                            'blur-md select-none': hidePrices,
                        })}
                    >
                        {formatCurrency(h.unrealized_gl_eur, Currency.EUR)}
                    </TableCell>
                    <TableCell
                        className={cn('text-right tabular-nums', {
                            'text-success': h.unrealized_gl_eur_pct > 0,
                            'text-destructive': h.unrealized_gl_eur_pct < 0,
                            'text-muted-foreground': h.unrealized_gl_eur_pct == 0,
                            'blur-md select-none': hidePrices,
                        })}
                    >
                        {formatPercentage(h.unrealized_gl_eur_pct)}
                    </TableCell>
                    <TableCell
                        className={cn('text-right tabular-nums', {
                            'text-success': h.unrealized_gl_with_fees_eur > 0,
                            'text-destructive': h.unrealized_gl_with_fees_eur < 0,
                            'text-muted-foreground': h.unrealized_gl_with_fees_eur == 0,
                            'blur-md select-none': hidePrices,
                        })}
                    >
                        {formatCurrency(h.unrealized_gl_with_fees_eur, Currency.EUR)}
                    </TableCell>
                    <TableCell
                        className={cn('text-right tabular-nums', {
                            'text-success': h.unrealized_gl_with_fees_eur_pct > 0,
                            'text-destructive': h.unrealized_gl_with_fees_eur_pct < 0,
                            'text-muted-foreground': h.unrealized_gl_with_fees_eur_pct == 0,
                            'blur-md select-none': hidePrices,
                        })}
                    >
                        {formatPercentage(h.unrealized_gl_with_fees_eur_pct)}
                    </TableCell>
                    <TableCell
                        className={cn('text-right tabular-nums', {
                            'text-success': h.total_gl_eur > 0,
                            'text-destructive': h.total_gl_eur < 0,
                            'text-muted-foreground': h.total_gl_eur == 0,
                            'blur-md select-none': hidePrices,
                        })}
                    >
                        {formatCurrency(h.total_gl_eur, Currency.EUR)}
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    )
}
