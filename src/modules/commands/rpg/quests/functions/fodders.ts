import { ProcessQuestProps, QuestCriteriaProps } from "@customTypes/quests";
import Cache from "cache";
import { CACHE_KEYS } from "helpers/cacheConstants";
import { getWeeklyQuestDates } from "helpers/quest";
import loggers from "loggers";
import { fetchAndCompleteQuest } from "../common";

const validateConsumedFodders = (criteria: QuestCriteriaProps, total: number) => {
	return criteria.toComplete && total >= criteria.toComplete;
};

export const processConsumeFodderQuest = async <ET extends { count: number; }>(params: ProcessQuestProps<ET>) => {
	try {
		loggers.info("processConsumeFodderQuest: started", { params });
		if (!params.options.extras) return;
		const { count } = params.options.extras;
		if (!count || isNaN(count)) return;
		const key = CACHE_KEYS.FODDERS_CONSUMED + params.user_tag;
		const cacheData = await Cache.get(key);

		let totalFoddersConsumed = count;
		if (cacheData) {
			totalFoddersConsumed = totalFoddersConsumed + Number(cacheData);
			if (isNaN(totalFoddersConsumed)) {
				loggers.error("Unable to complete consume fodders quest: ", {
					totalFoddersConsumed,
					cacheData 
				});
				return;
			}
		}
		if (typeof Cache.expire === "function") {
			const { toDate } = getWeeklyQuestDates();
			const timems = toDate - new Date().getTime();
			const seconds = Math.floor(timems / 1000);
			await Promise.all([
				Cache.set(key, totalFoddersConsumed.toString()),
				Cache.expire(key, seconds),
			]);
		}
		fetchAndCompleteQuest(params, (criteria) => {
			const isValid = validateConsumedFodders(criteria, totalFoddersConsumed);
			if (isValid) {
				Cache.del(key);
				return true;
			}
			return false;
		});
	} catch (err) {
		loggers.error("processCunsumeFodderQuest: ERROR", err);
		return;
	}
};