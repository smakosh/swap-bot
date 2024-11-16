'use client';

import { useAccount, useChainId } from 'wagmi';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getQuote, performSwapAction } from './_actions';
import { QuoteData } from './_types';
import { useEthersSigner } from './_utils';
import { createClient } from 'viem';

const SwapPage = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const signer = useEthersSigner();
  const [fromToken, setFromToken] = useState(
    '0x6b175474e89094c44da98b954eedeac495271d0f'
  );
  const [toToken, setToken] = useState(
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
  );
  const [amount, setAmount] = useState('1000000000000000000000');
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [swap, setSwap] = useState<any>(null);
  const [signed, setSigned] = useState<any>('');

  const getSigner = async () => {
    // const signed = await

    setSigned(signer?.provider);
  };

  useEffect(() => {
    getSigner();
  }, []);

  return (
    <div>
      <h1>Swap test</h1>
      <input
        value={fromToken}
        onChange={(e) => {
          setFromToken(e.target.value);
        }}
      />
      <input
        value={toToken}
        onChange={(e) => {
          setToken(e.target.value);
        }}
      />
      <input
        value={amount}
        onChange={(e) => {
          setAmount(e.target.value);
        }}
      />
      <div className="mt-2">
        <Button
          className="mr-5"
          onClick={async () => {
            const quote = await getQuote({
              fromTokenAddress: fromToken,
              toTokenAddress: toToken,
              amount: amount,
            });

            setQuote(JSON.parse(quote));
          }}
        >
          Get quote
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            const swapData = await performSwapAction({
              signer: signed,
              fromToken,
              toToken,
              amount,
              address,
            });

            setSwap(JSON.parse(swapData));
          }}
        >
          Swap
        </Button>
      </div>
      {swap && <pre>{JSON.stringify(swap, null, 2)}</pre>}
      {quote && <QuoteDetails data={quote} />}
    </div>
  );
};

const QuoteDetails = ({ data }: { data: QuoteData }) => {
  const [activePreset, setActivePreset] = useState('fast');

  const formatAmount = (amount: string, decimals: number = 18) => {
    return (parseInt(amount) / Math.pow(10, decimals)).toFixed(6);
  };

  const renderPresetDetails = (preset: string) => {
    const presetData = data.presets[preset as keyof typeof data.presets];
    return (
      <div className="space-y-2">
        <p>Auction Duration: {presetData.auctionDuration} seconds</p>
        <p>Start Auction In: {presetData.startAuctionIn} seconds</p>
        <p>
          Initial Rate Bump: {(presetData.initialRateBump / 10000).toFixed(2)}%
        </p>
        <p>
          Auction Start Amount: {formatAmount(presetData.auctionStartAmount)}
        </p>
        <p>Start Amount: {formatAmount(presetData.auctionStartAmount)}</p>
        <p>Auction End Amount: {formatAmount(presetData.auctionEndAmount)}</p>
        <p>Cost in Destination Token: {formatAmount(presetData.tokenFee)}</p>
      </div>
    );
  };

  return (
    <>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Token Exchange Information</CardTitle>
          <CardDescription>
            Details about the token exchange and available presets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">Source Token</h3>
              <p>
                Amount: {formatAmount(data.fromTokenAmount)} (
                {data.volume.usd.fromToken} USD)
              </p>
              <p>Price: ${data.prices.usd.fromToken}</p>
            </div>
            <div>
              <h3 className="font-semibold">Destination Token</h3>
              <p>
                Amount: {formatAmount(data.toTokenAmount)} (
                {data.volume.usd.toToken} USD)
              </p>
              <p>Price: ${data.prices.usd.toToken}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-12 gap-y-6 lg:gap-y-0 lg:gap-x-6 mt-4">
        <div className="col-span-12 lg:col-span-6">
          <Card>
            <CardHeader>
              <CardTitle>Exchange Presets</CardTitle>
              <CardDescription>
                Choose a preset for your exchange
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                defaultValue={data.recommendedPreset}
                onValueChange={setActivePreset}
              >
                <TabsList>
                  <TabsTrigger value="fast">Fast</TabsTrigger>
                  <TabsTrigger value="medium">Medium</TabsTrigger>
                  <TabsTrigger value="slow">Slow</TabsTrigger>
                </TabsList>
                <TabsContent value="fast">
                  {renderPresetDetails('fast')}
                </TabsContent>
                <TabsContent value="medium">
                  {renderPresetDetails('medium')}
                </TabsContent>
                <TabsContent value="slow">
                  {renderPresetDetails('slow')}
                </TabsContent>
              </Tabs>
              {activePreset === data.recommendedPreset && (
                <Badge className="mt-4" variant="secondary">
                  Recommended
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-6">
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* <p>Price Impact: {data.priceImpactPercent.toFixed(3)}%</p> */}
                {/* <p>Source Safety Deposit: {formatAmount(data.srcSafetyDeport)}</p> */}
                {/* <p>
              Destination Safety Deposit: {formatAmount(data.dstSafetyDeposit)}
            </p> */}
                <div>
                  <h3 className="font-semibold">Whitelist:</h3>
                  <ul className="list-disc list-inside">
                    {data.whitelist.map((address, index) => (
                      <li key={index} className="text-sm font-mono">
                        {address.val}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default SwapPage;
