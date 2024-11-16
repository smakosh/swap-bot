'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { calcDigits, formatPrice } from "@/lib/format";
import CopyToClipboard from "@/components/copy";

export default function Portfolio({
  result,
}: {
  result: {
    address: string
    values: {
      address: string;
      amount: number;
      value: number;
      symbol?: string;
      name?: string;
      icon?: string;
    }[];
  }
}) {
  const totalValue = result.values.reduce((sum, token) => sum + (token.value || 0), 0);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Portfolio
          <div className="text-sm text-muted-foreground font-mono">
            {result.address}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Value (USD)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.values.map((token) => (
              <TableRow key={token.address}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <img
                      src={token.icon}
                      alt={token.address}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        {token.symbol}
                        <CopyToClipboard text={token.address} hide />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {token.name}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {token.amount.toFixed(calcDigits(token.amount))}
                </TableCell>
                <TableCell className="text-right">{formatPrice(token.value)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4">
          <div className="text-xl font-semibold">
            Total Value: ${totalValue.toFixed(2)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
