import { ResponseWithPagination } from "@customTypes";
import { PageProps } from "@customTypes/pagination";
import { QuestProps } from "@customTypes/quests";
import { paginationForResult, paginationParams } from "helpers/pagination";
import loggers from "loggers";
import * as Quests from "../models/Quests";

export const getQuestsByUserLevel = async (
	params: { level: number },
	filters: PageProps
): Promise<ResponseWithPagination<QuestProps[]> | undefined> => {
	try {
		const result = await Quests.getByUserLevel(
			{ level: params.level },
			await paginationParams({
				currentPage: filters.currentPage,
				perPage: filters.perPage,
			})
		);
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
		return Quests.getByType(params);
	} catch (err) {
		loggers.error("api.controllers.QuestsController.getQuestByTypeAndLevel: ERROR", err);
		return;
	}
};