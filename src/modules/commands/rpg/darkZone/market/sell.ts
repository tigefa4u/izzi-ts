import { DzFuncProps } from "@customTypes/darkZone";
import loggers from "loggers";
import { sellCard } from "../../market/shop/sell";

export const sellDzCardOnMarket = async (params: DzFuncProps) => {
	try {
		sellCard({
			context: params.context,
			client: params.client,
			args: params.args,
			author: params.options.author,
			isDarkZone: true
		});
		return;
	} catch (err) {
		loggers.error("sellDzCardOnMarket: ERROR", err);
		return;
	}
};