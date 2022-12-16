import { ChannelProp } from "@customTypes";
import Cache from "cache";

type T = {
	timestamp: number;
	value?: string | number;
}

export const setCooldown = async (
	key: string,
	command: string,
	cd = 60, // @params in secs,
	value?: T["value"]
) => {
	try {
		const cdKey = `cooldown::${command}-${key}`;
		const dt = new Date();
		const params = { timestamp: dt.setSeconds(dt.getSeconds() + cd) } as T;
		if (value) {
			params.value = value;
		}
		await Cache.set(cdKey, JSON.stringify(params));
		if (Cache.expire) {
			await Cache.expire(cdKey, cd);
		}
		return true;
	} catch (err) {
		return;
	}
};
export const getCooldown: (key: string, command: string) => Promise<T | undefined> = async (key, command) => {
	try {
		const result = await Cache.get(`cooldown::${command}-${key}`);
		if (result) return JSON.parse(result);
		return;
	} catch (err) {
		return;
	}
};
export const clearCooldown = async (key: string, command: string) => {
	try {
		await Cache.del(`cooldown::${command}-${key}`);
		return;
	} catch (err) {
		return;
	}
};

export const getCDRemainingTime = (data: T, key: string, command: string) => {
	const remainingTime: number =
      (new Date(data.timestamp).valueOf() - new Date().valueOf()) / 1000;
	if (isNaN(remainingTime)) {
		clearCooldown(key, command);
		return {
			remainingHours: 0,
			remainingMinutes: 0,
			remainingSec: 0
		};
	}
	const remainingMS = remainingTime / 60;
	const remainingSec = remainingTime % 60;
	if (remainingTime < 0 || remainingSec < 0) {
		clearCooldown(key, command);
	}
	const remainingHours = Math.floor(remainingMS / 60);
	const remainingMinutes = Math.floor(remainingMS % 60);
	return {
		remainingHours,
		remainingMinutes,
		remainingSec: +remainingSec.toFixed(0)
	};
};

export const sendCommandCDResponse = (
	channel: ChannelProp,
	data: T,
	key: string,
	command: string
) => {
	try {
		const { remainingHours, remainingMinutes, remainingSec } = getCDRemainingTime(data, key, command);
		channel?.sendMessage(
			`This command is on cooldown, you can try again in ${
				remainingHours ?? ""
			} : ${remainingMinutes ?? ""} : ${remainingSec}`
		);
		return;
	} catch (err) {
		return;
	}
};
