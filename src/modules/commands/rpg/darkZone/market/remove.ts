import { DzFuncProps } from "@customTypes/darkZone";
import loggers from "loggers";
import { removeCardFromMarket } from "../../market/shop/remove";

export const removeDzCardFromMarket = async (params: DzFuncProps) => {
	try {
		removeCardFromMarket({
			client: params.client,
			args: params.args,
			context: params.context,
			command: params.command,
			author: params.options.author,
			isDarkZone: true
		});
		return;
	} catch (err) {
		loggers.error("removeDzCardFromMarket: ERROR", err);
	}
};