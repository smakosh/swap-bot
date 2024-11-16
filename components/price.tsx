'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReactNode } from 'react';
import { formatPrice } from "@/lib/format";

export default function CryptoPriceDisplay({
  asset,
  price,
}: {
  asset: string;
  price: number;
}) {
  return (
    <Card className="">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">{asset} Price</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          {formatPrice(price)}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Last updated: {new Date().toLocaleTimeString()}
        </p>
      </CardContent>
    </Card>
  );
}
