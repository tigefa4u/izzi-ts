import { FilterProps, ResponseWithPagination } from "@customTypes";
import { CharactersReturnType } from "@customTypes/characters";
import {
	CollectionParams,
	CollectionProps,
	CollectionReturnType,
	CollectionUpdateProps,
	CT,
	ICollectionCreateProps,
} from "@customTypes/collections";
import { ItemProps } from "@customTypes/items";
import { PageProps } from "@customTypes/pagination";
import { SortProps } from "@customTypes/sorting";
import Cache from "cache";
import { CHARACTER_LEVEL_EXTENDABLE_LIMIT, ranksMeta } from "helpers/constants";
import { getReqSouls } from "helpers/evolution";
import { paginationForResult, paginationParams } from "helpers/pagination";
import loggers from "loggers";
import { reorderObjectKey } from "utility";
import * as Collections from "../models/Collections";
import { getCharacterById, getCharacters } from "./CharactersController";
import { getItemById } from "./ItemsController";

type T = { user_id: number; };
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
		return Collections.create(data);
	} catch (err) {
		loggers.error(
			"api.controllers.CollectionsController.createCollection: ERROR",
			err
		);
		return;
	}
};

const safeParseCharacterParams = (params = {} as CT) => {
	const obj = {};
	if (params.name) {
		Object.assign(obj, { name: params.name });
	}
	if (params.type) {
		Object.assign(obj, { type: params.type });
	}
	if (params.isExactMatch) {
		Object.assign(obj, { isExactMatch: params.isExactMatch });
	}
	return obj;
};
export const getCollection: (
  params: CollectionParams & { limit?: number; isForTrade?: boolean; } & CT,
  cb?: (characters: CharactersReturnType, result: CollectionProps[]) => void
) => Promise<CollectionProps[] | undefined> = async function (params, cb) {
	try {
		let characters = [] as CharactersReturnType;
		if (params.name || params.type) {
			const resp = await getCharacters(safeParseCharacterParams(params));
			if (params.isForTrade && resp.length <= 0) {
				Object.assign(params, { character_ids: [] });
			} else if (resp && resp.length > 0) {
				characters = resp;
				Object.assign(params, { character_ids: resp.map((c) => c.id) });
			}
		}
		const result = await Collections.get(params);
		const charactersMeta = reorderObjectKey(characters, "id");
		const cidsToFetch: number[] = [];
		result.map(async (r, idx) => {
			if (charactersMeta[r.character_id]) {
				r.name = charactersMeta[r.character_id].name;
			} else {
				cidsToFetch.push(r.character_id);
			}
			return r;
		});
		if (cidsToFetch.length > 0) {
			const resp = await getCharacters({ ids: [ ...new Set(cidsToFetch) ] });
			if (resp) {
				const meta = reorderObjectKey(resp, "id");
				result.map((r) => {
					if (meta[r.character_id] && !r.name) {
						r.name = meta[r.character_id].name;
					}
				});
			}
		}
		if (cb && params.isForTrade) {
			cb(characters, result);
		}
		return result;
	} catch (err) {
		loggers.error(
			"api.controllers.CollectionsController.getCollection: ERROR",
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
		return Collections.update(params, data);
	} catch (err) {
		loggers.error(
			"api.controllers.CollectionsController.updateCollection: ERROR",
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
	filter: Omit<FilterProps, "category" | "ids"> & T,
	pageProps: PageProps,
	sort?: SortProps
): Promise<ResponseWithPagination<CollectionReturnType[]> | undefined> => {
	try {
		let charactersData = [] as C[];
		if (filter.name || filter.type || filter.abilityname || filter.series) {
			charactersData = await fetchCharacterDetails(filter);
		}
		if (charactersData.length > 0) {
			Object.assign(filter, { character_ids: charactersData.map((c) => c.id) });
		}
		const [ result, _count ] = await Promise.all([
			Collections.getAll(
				{
					...filter,
					is_item: false
				},
				await paginationParams(pageProps),
				sort
			),
			Collections.getCountForGetAll({
				...filter,
				is_item: false
			})
		]);
		const total_count = Number((_count[0] || {}).total_count || 0);
		if (charactersData.length <= 0) {
			charactersData = await fetchCharacterDetails({ ids: result.map((r) => r.character_id), });
		}
		if (result.length > 0) {
			result[0].total_count = total_count || 0;
		}
		const [ pagination ] = await Promise.all([
			paginationForResult({
				data: result,
				query: pageProps,
			}),
			...result.map(async (c) => {
				let reqSouls = 0;
				if (c.rank_id === ranksMeta.ultimate.rank_id) {
					const souls = getReqSouls(c.rank_id);
					const levelDifference = c.character_level - (ranksMeta.ultimate.max_level || 70);
					if (levelDifference < CHARACTER_LEVEL_EXTENDABLE_LIMIT) {
						const extraSouls = Math.ceil(levelDifference ** 1.57);
						reqSouls = souls + extraSouls;
					}
				}
				c.reqSouls = reqSouls;
				// 	let remainingHours = 0,
				// 		remainingMinutes = 0;
				// 	if (c.is_on_cooldown) {
				// 		const key = "card-cd::" + c.id;
				// 		try {
				// 			let cd = (await Cache.get(key)) as any;
				// 			if (cd) {
				// 				cd = JSON.parse(cd) as any;
				// 				const { cooldownEndsAt } = cd;
				// 				const remainingTime =
				// (cooldownEndsAt - new Date().getTime()) / 1000 / 60;
				// 				remainingHours = Math.floor(remainingTime / 60);
				// 				remainingMinutes = Math.floor(remainingTime % 60);
				// 				if (remainingHours < 0) {
				// 					remainingHours = 0;
				// 				}
				// 				if (remainingMinutes < 0) {
				// 					remainingMinutes = 0;
				// 				}
				// 			}
				// 		} catch (err) {
				// 			// pass
				// 		}
				// 		c.remainingHours = remainingHours;
				// 		c.remainingMinutes = remainingMinutes;
				// 	}

			})
		]);
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
			"api.controllers.CollectionsController.getAllCollections: ERROR",
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
		return Collections.destroy(params);
	} catch (err) {
		loggers.error(
			"api.controllers.CollectionsController.deleteCollection: ERROR",
			err
		);
		return;
	}
};

export const verifyCollectionsById = async (params: { user_id: number; ids: number[] }) => {
	try {
		loggers.info("Verifying collections with: " + JSON.stringify(params));
		return Collections.verifyIds(params);
	} catch (err) {
		loggers.error(
			"api.controllers.CollectionsController.verifyCollectionsById: ERROR",
			err
		);
		return;
	}	
};

export const getCollectionsOnCooldown = async () => {
	try {
		return Collections.get({ is_on_cooldown: true });
	} catch (err) {
		loggers.error(
			"api.controllers.CollectionsController.getCollectionsInCooldown: ERROR",
			err
		);
		return;
	}
};

export const resetAllNicknames = async (user_id: number) => {
	try {
		return Collections.resetAllNicknames(user_id);
	} catch (err) {
		loggers.error(
			"api.controllers.CollectionsController.resetAllNicknames: ERROR",
			err
		);
		return;
	}	
};