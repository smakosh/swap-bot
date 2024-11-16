'use server';
import { FusionSDK, NetworkEnum } from '@1inch/fusion-sdk';

export const getQuote = async (params: any) => {
  const sdk = new FusionSDK({
    url: 'https://api.1inch.dev/fusion',
    network: NetworkEnum.ETHEREUM,
    authKey: process.env.ONE_INCH_API_KEY,
  });

  const quote = await sdk.getQuote(params);

  return JSON.stringify(quote, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
};

export const performSwapAction = async (data: any) => {
  // Initialize FusionSDK
  const sdk = new FusionSDK({
    url: 'https://api.1inch.dev/fusion',
    network: NetworkEnum.ETHEREUM, // Mainnet
    blockchainProvider: data.signer, // Use wagmi's signer
    authKey: process.env.ONE_INCH_API_KEY,
  });

  // Place an order
  const swap = sdk.placeOrder({
    fromTokenAddress: data.fromToken, // WETH
    toTokenAddress: data.toToken, // USDC
    amount: data.amount, // 0.05 ETH
    walletAddress: data.address,
  });

  console.log({ swap });

  return JSON.stringify(swap, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
};
