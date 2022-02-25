import { TradeActionProps } from "@customTypes/trade";
import loggers from "loggers";
import * as queue from "../../queue";

export const cancelTrade = async ({ tradeQueue, tradeId, channel }: TradeActionProps) => {
	try {
		await Promise.all([ queue.delFromQueue(tradeId), Object.keys(tradeQueue).map((k) => queue.delFromTrade(k)) ]);
		channel?.sendMessage("Trade cancelled");
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.trades.actions.view.cancelTrade(): something went wrong",
			err
		);
		return;
	}
};