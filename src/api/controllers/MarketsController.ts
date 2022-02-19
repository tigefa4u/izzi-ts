import { FilterProps, ResponseWithPagination } from "@customTypes";
import { IMarketProps, MarketCreateProps } from "@customTypes/market";
import { PageProps } from "@customTypes/pagination";
import { paginationForResult, paginationParams } from "helpers/pagination";
import loggers from "loggers";
import * as Markets from "../models/Markets";

export const getMarket = async (
	params: Pick<FilterProps, "rank" | "name" | "abilityname" | "type">,
	filter: PageProps
): Promise<ResponseWithPagination<IMarketProps[]> | undefined> => {
	try {
		const result = await Markets.getAll(
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
			"api.controllers.MarketsController.getMarket(): something went wrong",
			err
		);
		return;
	}
};

export const getMarketCollection = async (params: { is_on_market: boolean, collection_id: number }) => {
	try {
		return await Markets.getMarketCollection(params);
	} catch (err) {
		loggers.error("api.controllers.MarksController.getMarketCollection(): something went wrong", err);
		return;
	}
};

export const delFromMarket = async (params: { id?: number; collection_ids?: number | number[] }) => {
	try {
		loggers.info("Deleting card from market: " + JSON.stringify(params));
		return await Markets.del(params);
	} catch (err) {
		loggers.error("api.controllers.MarketsController.delFromMarket(): something went wrong", err);
		return;
	}
};

export const createMarketCard = async (data: MarketCreateProps) => {
	try {
		return await Markets.create(data);
	} catch (err) {
		loggers.error("api.controllers.MarketsController.createMarketCard(): something went wrong", err);
		return;
	}
};