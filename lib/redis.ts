import { createClient } from "redis";

type RedisClient = ReturnType<typeof createClient>;

let cachedClient: RedisClient | null = null;
let cachedClientPromise: Promise<RedisClient> | null = null;

function getRedisUrl(): string | null {
  const url = process.env.REDIS_URL;
  return url && url.length > 0 ? url : null;
}

async function connectClient(client: RedisClient): Promise<void> {
  if (client.isOpen) return;
  await client.connect();
}

export async function getRedisClient(): Promise<RedisClient | null> {
  const url = getRedisUrl();
  if (!url) return null;

  if (cachedClient) return cachedClient;

  if (!cachedClientPromise) {
    const client = createClient({ url });
    client.on("error", (error) => {
      console.error("Redis client error:", error);
    });

    cachedClientPromise = connectClient(client)
      .then(() => {
        cachedClient = client;
        return client;
      })
      .catch((error) => {
        cachedClientPromise = null;
        void client.disconnect().catch(() => {});
        throw error;
      });
  }

  return cachedClientPromise;
}

type RedisRatelimitSetOptions = {
  px?: number;
};

export type RedisRatelimitClient = {
  evalsha<T = unknown>(sha: string, keys: string[], args?: unknown[]): Promise<T>;
  eval<T = unknown>(script: string, keys: string[], args?: unknown[]): Promise<T>;
  get<T = string | null>(key: string): Promise<T>;
  set<TData>(
    key: string,
    value: TData,
    opts?: RedisRatelimitSetOptions
  ): Promise<TData | "OK" | null>;
  del(...keys: string[]): Promise<number>;
};

function normalizeRedisArgs(args: unknown[] | undefined): string[] {
  if (!args?.length) return [];
  return args.map((arg) => (arg === null || arg === undefined ? "" : String(arg)));
}

export function createRedisRatelimitClient(): RedisRatelimitClient {
  return {
    async evalsha<T = unknown>(sha: string, keys: string[], args?: unknown[]) {
      const client = await getRedisClient();
      if (!client) {
        throw new Error("REDIS_URL is not set");
      }

      return (await client.evalSha(sha, {
        keys,
        arguments: normalizeRedisArgs(args),
      })) as T;
    },

    async eval<T = unknown>(script: string, keys: string[], args?: unknown[]) {
      const client = await getRedisClient();
      if (!client) {
        throw new Error("REDIS_URL is not set");
      }

      return (await client.eval(script, {
        keys,
        arguments: normalizeRedisArgs(args),
      })) as T;
    },

    async get<T = string | null>(key: string) {
      const client = await getRedisClient();
      if (!client) {
        throw new Error("REDIS_URL is not set");
      }

      return (await client.get(key)) as T;
    },

    async set<TData>(key: string, value: TData, opts?: RedisRatelimitSetOptions) {
      const client = await getRedisClient();
      if (!client) {
        throw new Error("REDIS_URL is not set");
      }

      const stringValue =
        typeof value === "string" ? value : JSON.stringify(value);

      const result = opts?.px
        ? await client.set(key, stringValue, { PX: opts.px })
        : await client.set(key, stringValue);

      return result as "OK" | null;
    },

    async del(...keys: string[]) {
      const client = await getRedisClient();
      if (!client) {
        throw new Error("REDIS_URL is not set");
      }

      return await client.del(keys);
    },
  };
}
