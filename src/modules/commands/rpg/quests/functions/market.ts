import { ProcessQuestProps, QuestCriteria } from "@customTypes/quests";
import { RankProps } from "helpers/helperTypes";
import loggers from "loggers";
import { fetchAndCompleteQuest } from "../common";

const validateCriteria = (criteria: QuestCriteria, rank: RankProps, price: number) => {
	return criteria.mingold && criteria.mingold <= price && criteria.rank === rank;
};
export const processMarketQuest = async <
  ET extends {
    rank: RankProps;
    price: number;
  }
>(params: ProcessQuestProps<ET>) => {
	try {
		// Channel is not available here.
		loggers.info(
			"rpg.quests.functions.market: starting market quest for user: " +
        params.user_tag
		);
		if (!params.options.extras) return;
		const { rank, price } = params.options.extras;
		if (!rank || !price || isNaN(price)) return;

		fetchAndCompleteQuest(params, (criteria) => {
			const isValid = validateCriteria(
				criteria,
				rank,
				price
			);
			return isValid ? true : false;
		});
		return;
	} catch (err) {
		loggers.error("quests.functions.market.processMarketQuest: ERROR", err);
		return;
	}
};
