import { RedisClient } from "@hoax7/memory_cache/lib/types/redis";

export interface CacheProps extends RedisClient {
    fetch: <T>(key: string, cb: () => Promise<T>) => Promise<T>;
}