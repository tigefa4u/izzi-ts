import { TradeQueueProps } from "@customTypes/trade";
import Cache from "cache";

export const delFromTrade = async (key: string) => {
	return await Cache.del(`intrade-${key}`);
};

export const delFromQueue = async (key: string) => {
	return await Cache.del(`tradequeue-${key}`);
};

export const setTrade = async (key: string, value: string) => {
	return await Cache.set(`intrade-${key}`, value);
};

export const setTradeQueue = async (key: string, value: TradeQueueProps) => {
	await Cache.set(`tradequeue-${key}`, JSON.stringify(value));
	return value;
};

export const getTrade = async (key: string): Promise<string | undefined> => {
	const trade = await Cache.get(`intrade-${key}`);
	if (trade) return JSON.parse(trade);
	return;
};

export const getTradeQueue = async (key: string): Promise<TradeQueueProps | undefined> => {
	const trade = await Cache.get(`tradequeue-${key}`);
	if (trade) return JSON.parse(trade);
	return;
};

export const setTradeTTL = (key: string, ttl = 60 * 10) => {
	return Cache.expire && Cache.expire(key, ttl);
};