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

export const maxDuration = 60;

type AllowedTools = 'assetPrice' | 'swapTokens' | 'sendTokens'

const assetPriceTools: AllowedTools[] = ['assetPrice', 'swapTokens', 'sendTokens'];

const allTools: AllowedTools[] = [...assetPriceTools];

import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { normalize } from "viem/ens";

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
})

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
    maxSteps: 5,
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
            const ensAddress = await publicClient.getEnsAddress({
              name: normalize(to),
            })
            to = ensAddress;
          }
          // TODO

          return {
            ok: true
          }
        },
      },
    },
    onFinish: async ({ responseMessages }) => {
      if (session.user && session.user.id) {
        try {
          const responseMessagesWithoutIncompleteToolCalls =
            sanitizeResponseMessages(responseMessages);

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
