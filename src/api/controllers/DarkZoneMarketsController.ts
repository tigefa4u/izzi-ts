import { FilterProps, ResponseWithPagination } from "@customTypes";
import { DzMarketCreateProps, IDzMarketProps } from "@customTypes/market/darkZone";
import { PageProps } from "@customTypes/pagination";
import { paginationForResult, paginationParams } from "helpers/pagination";
import loggers from "loggers";
import * as Model from "../models/DarkZoneMarkets";

export const getDzMarketList = async (filter: any, pageProps: PageProps) => {
	try {
		return;
	} catch (err) {
		loggers.error("DarkZoneMarketsController.getDzMarketList: ERROR", err);
		return;
	}
};

export const getDzMarketCollection = async (params: { is_on_market: boolean, collection_id: number }) => {
	try {
		return Model.getMarketCollection(params);
	} catch (err) {
		loggers.error("api.controllers.DarkZoneMarketsController.getDzMarketCollection: ERROR", err);
		return;
	}
};

export const createDzMarket = async (data: DzMarketCreateProps) => {
	try {
		loggers.info("Inserting into Dark Zone markets", data);
		return Model.create(data);
	} catch (err) {
		loggers.error("DarkZoneMarketsController.createDzMarket: ERROR", err);
		return;
	}
};

export const delDzMarketCard = async (id: number) => {
	try {
		loggers.info("Deleting Dark Zone market card: ", id);
		return Model.del(id);
	} catch (err) {
		loggers.error("DarkZoneMarketsController.delDzMarketCard: ERROR", err);
		return;
	}
};

export const getAllDzMarketCards = async (
	params: Pick<FilterProps, "rank" | "name" | "abilityname" | "type" | "collection_ids" | "isExactMatch" | "series">,
	filter: PageProps
): Promise<undefined | ResponseWithPagination<IDzMarketProps[]>> => {
	try {
		const result = await Model.getAll(
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
		loggers.error("DarkZoneMarketsController.getAllDzMarketCards: ERROR", err);
		return;
	}
};
