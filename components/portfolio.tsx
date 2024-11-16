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
import Image from "next/image";

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
      chainId?: number;
    }[];
  }
}) {
  const totalValue = result.values.reduce((sum, token) => sum + (token.value || 0), 0);

  // Group tokens by chainId
  const groupedTokens = result.values.reduce((groups, token) => {
    const chainId = token.chainId || 0;
    if (!groups[chainId]) {
      groups[chainId] = [];
    }
    groups[chainId].push(token);
    return groups;
  }, {} as Record<number, typeof result.values>);

  // Get chain names
  const getChainName = (chainId: number) => {
    const chains: Record<number, string> = {
      1: 'Ethereum',
      56: 'BNB Chain',
      137: 'Polygon',
      0: 'Unknown Chain'
    };
    return chains[chainId] || `Chain ${chainId}`;
  };

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
        {Object.entries(groupedTokens).map(([chainId, tokens]) => (
          <div key={chainId} className="mb-8 last:mb-0">
            <h3 className="text-lg font-semibold mb-4">
              {getChainName(Number(chainId))}
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Value (USD)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((token) => (
                  <TableRow key={token.address}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {token.icon && (
                          <Image
                            width={32}
                            height={32}
                            src={token.icon}
                            alt={token.address}
                            className="w-8 h-8 rounded-full"
                          />
                        )}
                        {!token.icon && (
                          <div className="w-8 h-8 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                        <span className="text-sm text-muted-foreground">
                          {token.symbol?.[0]}{token.symbol?.[1]}
                        </span>
                          </div>
                        )}
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
          </div>
        ))}
        <div className="mt-4">
          <div className="text-xl font-semibold">
            Total Value: ${totalValue.toFixed(2)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
