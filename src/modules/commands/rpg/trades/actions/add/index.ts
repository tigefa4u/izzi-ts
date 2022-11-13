import { TradeActionProps } from "@customTypes/trade";
import loggers from "loggers";
import { addGoldToTrade } from "./gold";
import { addMultipleCards } from "./multipleCards";
import { addCardByIds } from "./cardByIds";

export const addToTrade = async (params: TradeActionProps) => {
	try {
		const cta = params.args.shift();
		if (!cta) return;
		if (cta === "gold") {
			addGoldToTrade(params);
		} else if (cta === "cards") {
			addMultipleCards(params);
		} else if (cta === "card") {
			addCardByIds(params);
		}
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.trades.actions.addToTrade: ERROR",
			err
		);
		return;
	}
};
