import { convertToCoreMessages, Message, StreamData, streamText } from 'ai';
import { z } from 'zod';

import { customModel } from '@/ai';
import { models } from '@/ai/models';
import { systemPrompt } from '@/ai/prompts';
import { auth } from '@/app/(auth)/auth';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from '@/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';

import { generateTitleFromUserMessage } from '../../actions';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { normalize } from 'viem/ens';

const get = async (url: string, opts?: RequestInit) => {
  const res = await fetch(url, opts);
  return await res.json();
};

export const maxDuration = 60;

type AllowedTools =
  | 'assetPrice'
  | 'swapTokens'
  | 'sendTokens'
  | 'portfolioBalance';

const assetPriceTools: AllowedTools[] = [
  'assetPrice',
  'swapTokens',
  'sendTokens',
  'portfolioBalance',
];

const allTools: AllowedTools[] = [...assetPriceTools];

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

interface TokenBalance {
  address: string;
  amount: number;
  symbol?: string;
  name?: string;
  icon?: string;
  price?: number;
  value?: number;
  chainId: string;
}

export async function POST(request: Request) {
  const {
    id,
    messages,
    modelId,
  }: { id: string; messages: Array<Message>; modelId: string } =
    await request.json();

  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const model = models.find((model) => model.id === modelId);

  if (!model) {
    return new Response('Model not found', { status: 404 });
  }

  const coreMessages = convertToCoreMessages(messages);
  const userMessage = getMostRecentUserMessage(coreMessages);

  if (!userMessage) {
    return new Response('No user message found', { status: 400 });
  }

  const chat = await getChatById({ id });

  if (!chat) {
    const title = await generateTitleFromUserMessage({ message: userMessage });
    await saveChat({ id, userId: session.user.id, title });
  }

  await saveMessages({
    messages: [
      { ...userMessage, id: generateUUID(), createdAt: new Date(), chatId: id },
    ],
  });

  const streamingData = new StreamData();

  const result = await streamText({
    model: customModel(model.apiIdentifier),
    system: systemPrompt,
    messages: coreMessages,
    maxSteps: 1,
    experimental_activeTools: allTools,
    tools: {
      assetPrice: {
        description:
          'Get current price of a given asset using its 3 or 4 letter ticker',
        parameters: z.object({
          asset: z.string(),
        }),
        execute: async ({ asset }) => {
          const res = await fetch(
            `https://www.deribit.com/api/v2/public/get_index_price?index_name=${(asset + '').toLowerCase()}_usd`,
            {
              headers: {
                Accept: 'application/json',
              },
              cache: 'no-cache',
            }
          );

          const data = await res.json();

          return data.result?.index_price;
        },
      },
      swapTokens: {
        description: 'Swap tokens using Uniswap',
        parameters: z.object({
          from: z.string(),
          to: z.string(),
          amount: z.string(),
        }),
        execute: async ({ from, to, amount }) => {
          // TODO
        },
      },
      sendTokens: {
        description: 'Send tokens to another address or ENS username',
        parameters: z.object({
          from: z.string(),
          to: z.string(),
          amount: z.string(),
        }),
        execute: async ({ from, to, amount }) => {
          if (to.includes('.eth')) {
            to = await publicClient.getEnsAddress({
              name: normalize(to),
            });
          }
          // TODO

          return {
            ok: true,
          };
        },
      },
      portfolioBalance: {
        description:
          'Get the portfolio/token balances of a given address or ENS username',
        parameters: z.object({
          address: z.string(),
        }),
        execute: async ({ address }) => {
          console.log('START fetching balances for', address);

          const all: TokenBalance[] = [];
          const originalAddress = address as string;
          if (address.includes('.eth')) {
            address = await publicClient.getEnsAddress({
              name: normalize(address),
            });
          }

          const chainIds = ['1', '56', '137'];
          for (const chainId of chainIds) {
            console.log('chain id', chainId);
            const map = await get(
              `https://api.1inch.dev/balance/v1.2/1/balances/${address}`,
              {
                headers: {
                  Authorization: `Bearer ${process.env.ONE_INCH_API_KEY}`,
                  accept: 'application/json',
                  'content-type': 'application/json',
                },
              }
            );
            console.log('map', map);

            const values = Object.entries(map)
              .map(([key, value]) => ({
                address: key,
                amount: Number(value) / 1e18,
                chainId: chainId,
              }))
              .filter((token) => Number(token.amount) > 0) as TokenBalance[];

            for (let i = 0; i < values.length; i++) {
              console.log('fetching token info for', values[i].address);
              const token = values[i];
              const tokenInfo = (await get(
                `https://api.1inch.dev/token/v1.2/${token.chainId}/custom/${token.address}`,
                {
                  headers: {
                    Authorization: `Bearer ${process.env.ONE_INCH_API_KEY}`,
                    accept: 'application/json',
                    'content-type': 'application/json',
                  },
                }
              )) as {
                symbol: string;
                name: string;
                address: string;
                chainId: number;
                decimals: number;
                logoURI: string;
                isFoT: boolean;
                rating: number;
                eip2612: boolean;
                tags: {
                  value: string;
                  provider: string;
                }[];
                providers: string[];
              };

              token.symbol = tokenInfo.symbol;
              token.name = tokenInfo.name;
              token.icon = tokenInfo.logoURI;
            }

            console.log('fetching prices for', chainId);

            const prices = await get(
              `https://api.1inch.dev/price/v1.1/${chainId}`,
              {
                method: 'POST',
                headers: {
                  Authorization: 'Bearer fS3GZVT0S6XKEZPNe98WGiWCUCu3pZ8S',
                  accept: 'application/json',
                  'content-type': 'application/json',
                },
                body: JSON.stringify({
                  tokens: values.map((token) => token.address),
                  currency: 'USD',
                }),
              }
            );

            for (let i = 0; i < values.length; i++) {
              for (const key in prices) {
                if (values[i].address === key) {
                  values[i].price = Number(prices[key]);
                  values[i].value = values[i].amount * (values[i].price || 0);
                }
              }
            }

            all.push(...values);
          }

          console.log('DONE fetch values', all);

          return {
            address: originalAddress,
            values: all.filter((token) => token.symbol),
          };
        },
      },
    },
    onFinish: async ({ responseMessages }) => {
      if (session.user && session.user.id) {
        try {
          const responseMessagesWithoutIncompleteToolCalls =
            sanitizeResponseMessages(responseMessages);

          if (responseMessagesWithoutIncompleteToolCalls.length > 0) {
            await saveMessages({
              messages: responseMessagesWithoutIncompleteToolCalls.map(
                (message) => {
                  const messageId = generateUUID();

                  if (message.role === 'assistant') {
                    streamingData.appendMessageAnnotation({
                      messageIdFromServer: messageId,
                    });
                  }

                  return {
                    id: messageId,
                    chatId: id,
                    role: message.role,
                    content: message.content,
                    createdAt: new Date(),
                  };
                }
              ),
            });
          }
        } catch (error) {
          console.error('Failed to save chat');
        }
      }

      streamingData.close();
    },
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'stream-text',
    },
  });

  return result.toDataStreamResponse({
    data: streamingData,
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
