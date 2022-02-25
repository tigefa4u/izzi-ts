import { TradeQueueProps } from "@customTypes/trade";
import Cache from "cache";

export const delFromTrade = async (key: string) => {
	return await Cache.del(`intrade-${key}`);
};

export const delFromQueue = async (key: string) => {
	return await Cache.del(`tradequeue-${key}`);
};

export const setTrade = async (key: string, value: string) => {
	await Cache.set(`intrade-${key}`, value);
	setTradeTTL(`intrade-${key}`);
	return value;
};

export const setTradeQueue = async (key: string, value: TradeQueueProps) => {
	await Cache.set(`tradequeue-${key}`, JSON.stringify(value));
	setTradeTTL(`tradequeue-${key}`);
	return value;
};

export const getTrade = async (key: string): Promise<string | null> => {
	return await Cache.get(`intrade-${key}`);
};

export const getTradeQueue = async (key: string): Promise<TradeQueueProps | undefined> => {
	const trade = await Cache.get(`tradequeue-${key}`);
	if (trade) return JSON.parse(trade);
	return;
};

export const setTradeTTL = (key: string, ttl = 60 * 10) => {
	return Cache.expire && Cache.expire(key, ttl);
};