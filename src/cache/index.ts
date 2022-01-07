import redisClient from "@hoax7/memory_cache";
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT, REDIS_USERNAME } from "environment";
import loggers from "loggers";
import { CacheProps } from "./cacheTypes";

// let options = {
// 	url: `redis://${REDIS_USERNAME}:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}`,
// };

const client = new redisClient();

const Cache: CacheProps = {
	get: (key) => client.get(key),
	set: (key, value) => client.set(key, value),
	del: (key) => client.del(key),
	expire: (key, ttl) => client.expire(key, ttl),
	keys: (pattern = "*") => client.keys(pattern),
	fetch: async (key: string, cb: () => void) => {
		const data = await client.get(key);
		if (!data) {
			loggers.info("Cache miss for: " + key);
			return cb();
		}
		loggers.info("Cache hit for: " + key);
		return JSON.parse(data);
	}
};

export default Cache;