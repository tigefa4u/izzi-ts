import { ResponseWithPagination } from "@customTypes";
import { PageProps } from "@customTypes/pagination";
import { QuestProps } from "@customTypes/quests";
import Cache from "cache";
import { CACHE_KEYS } from "helpers/constants/cacheConstants";
import { paginationForResult, paginationParams } from "helpers/pagination";
import { questLevelsMap } from "helpers/questConstants";
import loggers from "loggers";
import * as Quests from "../models/Quests";

export const getQuestsByUserLevel = async (
	params: { level: number; user_tag: string; },
	filters: PageProps
): Promise<ResponseWithPagination<QuestProps[]> | undefined> => {
	try {
		let questLevelByUserLevel = 15;
		for (const lvl of Object.keys(questLevelsMap)) {
			if (params.level <= +lvl) {
				questLevelByUserLevel = questLevelsMap[+lvl];
				break;
			}
		}
		const key = CACHE_KEYS.QUEST_BY_LEVEL + questLevelByUserLevel;
		const result = await Cache.fetch(key, async () => {
			return Quests.getByUserLevel(
				{
					level: params.level,
					user_tag: params.user_tag 
				},
				await paginationParams({
					currentPage: filters.currentPage,
					perPage: filters.perPage,
				})
			);
		}, 60 * 60 * 24 * 7);
		const pagination = await paginationForResult({
			data: result,
			query: {
				currentPage: filters.currentPage,
				perPage: filters.perPage,
			},
		});

		return {
			data: result,
			metadata: pagination,
		};
	} catch (err) {
		loggers.error("api.controllers.QuestsController.getAllQuests: ERROR", err);
		return;
	}
};

export const getQuestByTypeAndLevel = async (params: { type: string; level: number; }) => {
	try {
		let result;
		let questLevelByUserLevel = 15;
		for (const lvl of Object.keys(questLevelsMap)) {
			if (params.level <= +lvl) {
				questLevelByUserLevel = questLevelsMap[+lvl];
				break;
			}
		}
		const key = CACHE_KEYS.QUEST_BY_LEVEL + questLevelByUserLevel;
		const res = await Cache.get(key);
		if (res) {
			const data: QuestProps[] = JSON.parse(res);
			result = data.filter((d) => d.type === params.type);
		} else {
			result = await Quests.getByType(params);
		}
		return result;
	} catch (err) {
		loggers.error("api.controllers.QuestsController.getQuestByTypeAndLevel: ERROR", err);
		return;
	}
};