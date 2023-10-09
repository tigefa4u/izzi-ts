import { ProcessQuestProps, QuestCriteriaProps } from "@customTypes/quests";
import Cache from "cache";
import { CACHE_KEYS } from "helpers/cacheConstants";
import { RankProps } from "helpers/helperTypes";
import { getWeeklyQuestDates } from "helpers/quest";
import loggers from "loggers";
import { fetchAndCompleteQuest } from "../common";

const validateCriteria = (criteria: QuestCriteriaProps, rank: RankProps, price: number) => {
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

const validateMarketPurchaseCriteria = (criteria: QuestCriteriaProps, totalPurchase: number) => {
	return criteria.purchase && totalPurchase >= criteria.purchase;
};
export const processMarketPurchaseQuest = async <ET extends { price: number; }>(params: ProcessQuestProps<ET>) => {
	try {
		loggers.info(
			"rpg.quests.functions.processMarketPurchaseQuest: starting market purchase quest for user: " +
        params.user_tag
		);
		if (!params.options.extras) return;
		const { price } = params.options.extras;
		if (!price || isNaN(price)) return;
		const key = CACHE_KEYS.MARKET_PURCHASE + params.user_tag;
		const marketPurchaseCache = await Cache.get(key);

		let totalPurchase = price;
		if (marketPurchaseCache) {
			totalPurchase = totalPurchase + Number(marketPurchaseCache);
			if (isNaN(totalPurchase)) {
				loggers.error("Unable to complete market purchase quest: ", {
					totalPurchase,
					marketPurchase: marketPurchaseCache
				});
				return;
			}
		}
		if (typeof Cache.expire === "function") {
			const { toDate } = getWeeklyQuestDates();
			const timems = toDate - new Date().getTime();
			const seconds = Math.floor(timems / 1000);
			await Promise.all([
				Cache.set(key, totalPurchase.toString()),
				Cache.expire(key, seconds),
			]);
		}
		/**
		 * Fetch gold spent this week on market from cache.
		 * Cache needs to reset every Monday at 00.00.00.
		 */
		console.log("Market purchase quest started: ", price);
		fetchAndCompleteQuest(params, (criteria) => {
			const isValid = validateMarketPurchaseCriteria(criteria, totalPurchase);
			if (isValid) {
				Cache.del(key);
				return true;
			}
			return false;
		});
	} catch (err) {
		loggers.error("processMarketPurchaseQuest: ERROR", err);
		return;
	}
};
