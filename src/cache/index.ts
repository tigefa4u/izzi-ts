import redisClient from "@hoax7/memory_cache";
import { RedisClient } from "@hoax7/memory_cache/lib/types/redis";

const client = new redisClient();

const Cache: RedisClient = {
	get: (key) => client.get(key),
	set: (key, value) => client.set(key, value),
	del: (key) => client.del(key),
	expire: (key, ttl) => client.expire(key, ttl),
	keys: (pattern = "*") => client.keys(pattern),
};

export default Cache;