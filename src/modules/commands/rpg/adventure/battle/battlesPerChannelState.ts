import { BATTLES_PER_CHANNEL } from "helpers/constants";

let battlesInChannel: Map<string, number> = new Map();

export const get = (channelId: string) => {
	return battlesInChannel.get(channelId);
};

export const set = (channelId: string, value: number): Map<string, number> => {
	if (value <= 0) {
		battlesInChannel.delete(channelId);
		return new Map();
	}
	return battlesInChannel.set(channelId, value);
};

export const validateBattlesInChannel = (channelId: string) => {
	const battles = get(channelId) || 0;
	if (battles >= BATTLES_PER_CHANNEL) {
		return;
	}
	return battles;
};

export const autoClear = () => {
	return battlesInChannel = new Map();
};