import { ProcessQuestProps } from "@customTypes/quests";
import { getRPGUser } from "api/controllers/UsersController";
import loggers from "loggers";
import { fetchAndCompleteQuest } from "../common";

export const processTradingQuest = async <
  ET extends {
    tradeQueueLen: number;
  }
>(
	params: ProcessQuestProps<ET>
) => {
	try {
		loggers.info(
			"rpg.quests.functions.market: starting market quest for user: " +
        params.user_tag
		);
		if (!params.options.extras) return;
		const { tradeQueueLen } = params.options.extras;
		if (!tradeQueueLen || isNaN(tradeQueueLen)) return;
		const user = await getRPGUser({ user_tag: params.user_tag });
		if (!user) return;
		params.level = user.level;
		fetchAndCompleteQuest(params, (criteria) => {
			/**
       * Validate quest criteria per difficulty
       */
			const isCriteriaValid =
        criteria.cardsToTrade && tradeQueueLen >= criteria.cardsToTrade
        	? true
        	: false;

			loggers.info("tradingQuest: validate criteria evaluated to: " + isCriteriaValid);
			return isCriteriaValid;
		});
		return;
	} catch (err) {
		loggers.error("quests.functions.trading.processTradingQuest: ERROR", err);
		return;
	}
};
