import { FilterProps, ResponseWithPagination } from "@customTypes";
import {
	CollectionParams,
	CollectionProps,
	CollectionReturnType,
	CollectionUpdateProps,
	ICollectionCreateProps,
} from "@customTypes/collections";
import { ItemProps } from "@customTypes/items";
import { PageProps } from "@customTypes/pagination";
import { paginationForResult, paginationParams } from "helpers/pagination";
import loggers from "loggers";
import * as Collections from "../models/Collections";
import { getCharacters } from "./CharactersController";
import { getItemById } from "./ItemsController";

type T = { user_id: number };
type C = {
  id: number;
  abilityname: string;
  abilitydescription: string;
  name: string;
  type: string;
};

export const createCollection: (
  data: ICollectionCreateProps
) => Promise<CollectionProps[] | CollectionProps | undefined> = async function (
	data
) {
	try {
		if (!data) return;
		loggers.info("creating collection with data: " + JSON.stringify(data));
		return await Collections.create(data);
	} catch (err) {
		loggers.error(
			"api.controllers.CollectionsController.createCollection(): something went wrong",
			err
		);
		return;
	}
};

export const getCollection: (
  params: CollectionParams & { limit?: number }
) => Promise<CollectionProps[] | undefined> = async function (params) {
	try {
		const result = await Collections.get(params);
		return result;
	} catch (err) {
		loggers.error(
			"api.controllers.CollectionsController.getCollection(): something went wrong",
			err
		);
		return;
	}
};

export const updateCollection = async (
	params: Pick<CollectionParams, "id" | "ids">,
	data: CollectionUpdateProps
): Promise<number | undefined> => {
	try {
		loggers.info(
			"Updating Collection with: " +
        JSON.stringify(params) +
        " Data: " +
        JSON.stringify(data)
		);
		return await Collections.update(params, data);
	} catch (err) {
		loggers.error(
			"api.controllers.CollectionsController.updateCollection(): something went wrong",
			err
		);
		return;
	}
};

async function fetchCharacterDetails(filter: FilterProps) {
	const characters = await getCharacters(filter);
	return characters.map((c) => ({
		id: c.id,
		abilityname: c.abilityname,
		abilitydescription: c.abilitydescription,
		name: c.name,
		type: c.type,
	}));
}

export const getAllCollections = async (
	filter: Omit<FilterProps, "series" | "category" | "ids"> & T,
	pageProps: PageProps
): Promise<ResponseWithPagination<CollectionReturnType[]> | undefined> => {
	try {
		let charactersData = [] as C[];
		if (filter.name || filter.type || filter.abilityname) {
			charactersData = await fetchCharacterDetails(filter);
		}
		if (charactersData.length > 0) {
			Object.assign(filter, { character_ids: charactersData.map((c) => c.id) });
		}
		const result = await Collections.getAll(
			{
				...filter,
				is_item: false
			},
			await paginationParams(pageProps)
		);
		if (charactersData.length <= 0) {
			charactersData = await fetchCharacterDetails({ ids: result.map((r) => r.character_id), });
		}
		const pagination = await paginationForResult({
			data: result,
			query: pageProps,
		});
		const item_ids = result.filter((r) => r.item_id).map((c) => c.item_id);
		let items = [] as ItemProps[];
		if (item_ids.length > 0) {
			const promises = item_ids.map((id) => getItemById({ id }));
			items = (await Promise.all(promises))
				.filter(f => !!f) as ItemProps[];
		}
		const resp = result.map((res) => {
			const index = charactersData.findIndex((c) => c.id === res.character_id);
			const itemIdx = items.findIndex((i) => i.id === res.item_id);
			if (itemIdx >= 0) {
				Object.assign(res, { itemname: items[itemIdx].name });
			}
			return Object.assign(res, {
				name: charactersData[index].name,
				abilityname: charactersData[index].abilityname,
				abilitydescription: charactersData[index].abilitydescription,
				type: charactersData[index].type,
			});
		});
		return {
			data: resp,
			metadata: pagination,
		};
	} catch (err) {
		loggers.error(
			"api.controllers.CollectionsController.getAllCollections(): something went wrong",
			err
		);
		return;
	}
};

export const deleteCollection = async (
	params: Pick<CollectionParams, "id" | "ids">
) => {
	try {
		loggers.info("Deleting collections with: " + JSON.stringify(params));
		return await Collections.destroy(params);
	} catch (err) {
		loggers.error(
			"api.controllers.CollectionsController.deleteCollection(): something went wrong",
			err
		);
		return;
	}
};

export const verifyCollectionsById = async (params: { user_id: number; ids: number[] }) => {
	try {
		loggers.info("Verifying collections with: " + JSON.stringify(params));
		return await Collections.verifyIds(params);
	} catch (err) {
		loggers.error(
			"api.controllers.CollectionsController.verifyCollectionsById(): something went wrong",
			err
		);
		return;
	}	
};