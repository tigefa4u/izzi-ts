import { MarketLogCreateProps } from "@customTypes/market";
import loggers from "loggers";
import * as Model from "../models/MarketLogs";

export const createMarketLog = async (data: MarketLogCreateProps) => {
	try {
		loggers.info("Creating market logs with data ", { data });
		return Model.create(data);
	} catch (err) {
		loggers.error("api.controller.MarketLogsController.create: ERROR", err);
		return;
	}
};

type P = { characterId: number; rankId: number };
export const getMarketLogList = async (params: P) => {
	try {
		loggers.info("Fetching market log list for params ", { params });
		return Model.getByCharacterAndRankId(params);
	} catch (err) {
		loggers.error(
			"api.controller.MarketLogsController.getMarketLogList: ERROR",
			err
		);
		return;
	}
};

export const getAvgMarketPrice = async (params: P) => {
	try {
		loggers.info("Fetching market average price for params ", { params });
		return Model.getAveragePriceOfCharacterAndRankId(params);
	} catch (err) {
		loggers.error(
			"api.controller.MarketLogsController.getAvgMarketPrice: ERROR",
			err
		);
		return;
	}
};

export const getYearlyTaxPaid = async (params: {
  user_tag: string;
}): Promise<{ sum: number; count: number } | undefined> => {
	try {
		return Model.getYearlyTotalTaxPaid(params);
	} catch (err) {
		loggers.error(
			"api.controller.MarketLogsController.getYearlyTaxPaid: ERROR",
			err
		);
		return;
	}
};
