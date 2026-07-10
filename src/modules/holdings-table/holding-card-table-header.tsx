import { TableHeader, TableRow, TableHead } from '@/components/ui/table'

export const HoldingsCardTableHeader = () => {
    return (
        <TableHeader>
            <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Total Invested</TableHead>
                <TableHead className="text-right">Total Fees</TableHead>
                <TableHead className="text-right">Market Value</TableHead>
                <TableHead className="text-right">AC/Share</TableHead>
                <TableHead className="text-right">R G/L</TableHead>
                <TableHead className="text-right">UNR G/L</TableHead>
                <TableHead className="text-right">UNR G/L %</TableHead>
                <TableHead className="text-right">UNR G/L (w/ fees)</TableHead>
                <TableHead className="text-right">UNR G/L % (w/ fees)</TableHead>
                <TableHead className="text-right">Total G/L</TableHead>
            </TableRow>
        </TableHeader>
    )
}
