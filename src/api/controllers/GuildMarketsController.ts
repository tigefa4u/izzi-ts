import { ResponseWithPagination } from "@customTypes";
import { GuildMarketProps } from "@customTypes/guildMarkets";
import { PageProps } from "@customTypes/pagination";
import Cache from "cache";
import { paginationForResult, paginationParams } from "helpers/pagination";
import loggers from "loggers";
import * as GuildMarkets from "../models/GuildMarkets";

export const getGuildMarket = async (
	params: { ids?: number[] },
	filter: PageProps
): Promise<ResponseWithPagination<GuildMarketProps[]> | undefined> => {
	try {
		const result = await GuildMarkets.getAll(
			params,
			await paginationParams(filter)
		);
		const pagination = await paginationForResult({
			data: result,
			query: filter,
		});
		return {
			data: result,
			metadata: pagination,
		};
	} catch (err) {
		loggers.error(
			"api.controllers.GuildMarketsController.getGuildMarket: ERROR",
			err
		);
		return;
	}
};

export const getGuildMarketItem = async (params: { id: number }) => {
	try {
		const key = "guild-market-item::" + params.id;
		const result = await Cache.fetch(key, async () => {
			const res = await GuildMarkets.get(params);
			return res[0];
		});

		return result;
	} catch (err) {
		loggers.error(
			"api.controllers.GuildMarketsController.getGuildMarketItem: ERROR",
			err
		);
		return;
	}
};