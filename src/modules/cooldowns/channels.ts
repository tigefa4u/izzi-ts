import Cache from "cache";

export const incrCooldown = async (key: string, command: string, cd = 10) => {
	try {
		const cdKey = `cooldown::${command}-${key}`;
		await Cache.incr(cdKey);
		if (Cache.expire) {
			await Cache.expire(cdKey, cd);
		}
	} catch (err) {
		return;
	}
};
export const getTTL = async (key: string, command: string) => {
	try {
		return await Cache.ttl(`cooldown::${command}-${key}`);
	} catch (err) {
		console.log(err);
		return 0;
	}
};
export const getChannelCooldown = async (key: string, command: string): Promise<number | undefined> => {
	try {
		const result = await Cache.get(`cooldown::${command}-${key}`);
		if (result) return +JSON.parse(result);
		return;
	} catch (err) {
		return;
	}
};