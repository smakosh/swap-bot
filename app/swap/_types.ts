type AuctionPreset = {
  auctionDuration: string;
  startAuctionIn: string;
  bankFee: string;
  initialRateBump: number;
  auctionStartAmount: string;
  auctionEndAmount: string;
  tokenFee: string;
  points: {
    delay: number;
    coefficient: number;
  }[];
  gasCostInfo: {
    gasPriceEstimate: string;
    gasBumpEstimate: string;
  };
  allowPartialFills: boolean;
  allowMultipleFills: boolean;
};

export type QuoteData = {
  params: {
    fromTokenAddress: { val: string };
    toTokenAddress: { val: string };
    amount: string;
    walletAddress: { val: string };
    enableEstimate: boolean;
    source: string;
    isPermit2: boolean;
  };
  fromTokenAmount: string;
  feeToken: string;
  presets: {
    fast: AuctionPreset;
    medium: AuctionPreset;
    slow: AuctionPreset;
  };
  toTokenAmount: string;
  prices: {
    usd: {
      fromToken: string;
      toToken: string;
    };
  };
  volume: {
    usd: {
      fromToken: string;
      toToken: string;
    };
  };
  quoteId: string | null;
  whitelist: { val: string }[];
  recommendedPreset: keyof QuoteData['presets'];
  settlementAddress: { val: string };
};
