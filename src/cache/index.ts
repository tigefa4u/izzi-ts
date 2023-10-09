import redisClient from "@hoax7/memory_cache";
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT, REDIS_USERNAME } from "environment";
import { getEodTimeRemainingInSec } from "helpers";
import loggers from "loggers";
import { CacheProps } from "./cacheTypes";

// let options = {
// 	url: `redis://${REDIS_USERNAME}:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}`,
// };

const client = new redisClient({ password: REDIS_PASSWORD });
// const client = new redisClient({}, { host: REDIS_HOST });
// const client = new redisClient({ password: REDIS_PASSWORD }, {
// 	port: REDIS_PORT,
// 	host: REDIS_HOST
// });

const Cache: CacheProps & {
	expireEod: (key: string) => Promise<boolean> | undefined;
} = {
	get: (key) => client.get(key),
	set: (key, value) => client.set(key, value),
	del: (key) => client.del(key),
	/**
	 * 
	 * @param key 
	 * @param ttl in seconds
	 * @returns 
	 */
	expire: (key, ttl) => client.expire(key, ttl),
	keys: (pattern = "*") => client.keys(pattern),
	/**
	 * Fetch and cache data
	 * @param key 
	 * @param cb 
	 * @param ttl in seconds
	 * @returns 
	 */
	fetch: async <T>(key: string, cb: () => Promise<T>, ttl?: number) => {
		const data = await client.get(key);
		if (!data) {
			const expireIn = ttl || 60 * 60;
			// loggers.info("Cache miss for: " + key + " and expires in: " + ttl + "sec");
			const resp = await cb();
			if (resp) {
				client.set(key, JSON.stringify(resp));
				client.expire(key, expireIn);
			}
			return resp;
		}
		// loggers.info("Cache hit for: " + key);
		return data ? JSON.parse(data) : null;
	},
	incr: (key) => client.incr(key),
	decr: (key) => client.decr(key),
	ttl: (key) => client.ttl(key),
	expireEod: (key: string) => client.expire(key, getEodTimeRemainingInSec())
};

export default Cache;