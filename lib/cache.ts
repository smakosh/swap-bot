const cache: { [key: string]: any } = {};

// noinspection JSUnusedGlobalSymbols
export const MemoryCache = {
  async get(key: string) {
    if (!cache[key]) {
      return null;
    }
    return JSON.parse(cache[key]);
  },
  async set(key: string, value: any, _ttl?: number) {
    cache[key] = JSON.stringify(value);
  },
};

export async function cachify<T>(
  fetcher: () => Promise<T>,
  cacheKey: string,
  ttl: number = 60 * 60 // 1 hour
): Promise<T> {
  const existing = await MemoryCache.get(cacheKey);
  if (existing) {
    return existing;
  }
  const func = fetcher();
  console.log('a');
  const res = await func;
  console.log('b');
  await MemoryCache.set(cacheKey, res, ttl);
  return res;
}
