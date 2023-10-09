import { FilterProps, ResponseWithPagination } from "@customTypes";
import { CustomServerCardAndCharacterProps } from "@customTypes/guildEvents/customServerCards";
import { PageProps } from "@customTypes/pagination";
import Cache from "cache";
import { paginationForResult, paginationParams } from "helpers/pagination";
import loggers from "loggers";
import * as Model from "../models/CustomServerCards";

export const getAllCustomServerCards = async (
	params: { guild_id: string } & Pick<
    FilterProps,
    "abilityname" | "name" | "series" | "type"
  >,
	filter: PageProps
): Promise<ResponseWithPagination<CustomServerCardAndCharacterProps[]> | undefined> => {
	try {
		const result = await Model.getAll(
			params,
			await paginationParams({
				perPage: filter.perPage,
				currentPage: filter.currentPage,
			})
		);
		const paginate = await paginationForResult({
			data: result,
			query: filter
		});
		return {
			data: result,
			metadata: paginate
		};
	} catch (err) {
		loggers.error(
			"CustomServerCardsController.getAllCustomServerCards: ERROR",
			err
		);
		return;
	}
};

export const getRandomCustomCard = async (guild_id: string) => {
	try {
		return Model.getRandom(guild_id);
	} catch (err) {
		loggers.error("CustomServerCardsController.getRandomCustomCard: ERROR", err);
		return;
	}
};

export const getCustomServerCardByCharacterId = async (cid: number | number[]) => {
	try {
		const key = "custom-server-card:" + cid;
		const result = await Cache.fetch(key, () => {
			return Model.getByCharacterId(cid);
		}, 60 * 60 * 48);
		return result;
	} catch (err) {
		loggers.error("getCustomServerCardByCharacterId: ERROR", err);
		return;
	}
};
