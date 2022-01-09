import { FilterProps, ResponseWithPagination } from "@customTypes";
import { PageProps } from "@customTypes/pagination";
import { paginationForResult, paginationParams } from "helpers/pagination";
import loggers from "loggers";
import * as Markets from "../models/Markets";
import { getCharacters } from "./CharactersController";
import { getCollection } from "./CollectionsController";

export const getMarket = async (
	params: Pick<FilterProps, "rank" | "name" | "abilityname">,
	filter: PageProps
): Promise<ResponseWithPagination<any> | undefined> => {
	try {
		let character_ids;
		const collectionParams = params;
		if (params.name || params.abilityname) {
			const characters = await getCharacters(params);
			character_ids = characters.map((c) => c.id);
			if (character_ids.length > 0) {
				Object.assign(collectionParams, { character_ids });
			}
		}
		if (params.rank) {
			Object.assign(collectionParams, { rank: params.rank });
		}
		const collections = await getCollection({
			...collectionParams,
			is_item: false,
			is_on_market: true,
		});
		const collection_ids = collections?.map((c) => c.id);
		if (!collection_ids) return;
		const result = await Markets.getAll(
			{ collection_ids },
			await paginationParams(filter)
		);
		const pagination = await paginationForResult({
			data: result,
			query: filter,
		});
		return {
			data: result,
			metadata: pagination,
		};
	} catch (err) {
		loggers.error(
			"api.controllers.MarketsController.getMarket(): something went wrong",
			err
		);
		return;
	}
};
