import { FilterProps, ResponseWithPagination } from "@customTypes";
import { CharactersReturnType } from "@customTypes/characters";
import {
	CollectionCreateProps,
	CollectionParams,
	CollectionProps,
	CollectionReturnType,
	CollectionUpdateProps,
	CT,
	DirectUpdateCreateFodderProps,
	ICollectionCreateProps,
	ICollectionItemCreateProps,
} from "@customTypes/collections";
import { ItemProps } from "@customTypes/items";
import { PageProps } from "@customTypes/pagination";
import { SortProps } from "@customTypes/sorting";
import {
	CHARACTER_LEVEL_EXTENDABLE_LIMIT, FODDER_RANKS, STARTER_CARD_EXP, STARTER_CARD_LEVEL, STARTER_CARD_R_EXP 
} from "helpers/constants/constants";
import { getReqSouls } from "helpers/evolution";
import { paginationForResult, paginationParams } from "helpers/pagination";
import { MASTERY_TITLE, ranksMeta } from "helpers/constants/rankConstants";
import loggers from "loggers";
import { reorderObjectKey } from "utility";
import * as Collections from "../models/Collections";
import { getCharacters } from "./CharactersController";
import { getItemById } from "./ItemsController";
import { safeParseCharacterParams } from "helpers";

type T = { user_id: number; };
type C = {
  id: number;
  abilityname: string;
  abilitydescription: string;
  name: string;
  type: string;
};

export const consumeFodders = async (data: DirectUpdateCreateFodderProps) => {
	try {
		const conn = Collections.dbConnection;
		const idsToDelete: number[] = [];
		await Promise.all(data.map(async (d) => {
			const res = await conn(Collections.tableName).where({
				rank: "platinum",
				rank_id: ranksMeta.platinum.rank_id,
				user_id: d.user_id,
				character_id: d.character_id
			}).where("card_count", ">=", d.count)
				.update({ card_count: conn.raw(`card_count - ${d.count}`) })
				.returning("*")
				.then((resp) => resp[0]);
			
			if (!res) {
				throw new Error("consumeFodder Update failed: Insufficient cards");
			}
			if (res.card_count <= 0) {
				idsToDelete.push(res.id);
				// loggers.info("CollectionControllers.consumeFodders: deleting fodder: ", res, d);
				// await conn(Collections.tableName).where({
				// 	id: res.id,
				// 	// rank: "platinum",
				// 	// rank_id: ranksMeta.platinum.rank_id,
				// 	// user_id: d.user_id,
				// 	// character_id: d.character_id
				// }).del();
			}
			return res;
		}));
		if (idsToDelete.length > 0) {
			loggers.info("CollectionsControllers.consumeFodders: deleting fodders:", idsToDelete);
			await conn(Collections.tableName).whereIn("id", idsToDelete).del();
		}
		return;
	} catch (err) {
		loggers.error("CollectionsController.consumeFodder: ERROR", err);
		return;
	}
};

export const directUpdateCreateFodder = async (data: DirectUpdateCreateFodderProps) => {
	try {
		const dataToInsert: CollectionCreateProps[] = [];
		const conn = Collections.dbConnection;
		return Promise.all(data.map(async (d) => {
			try {
				const res = await conn(Collections.tableName).where({
					rank: "platinum",
					rank_id: ranksMeta.platinum.rank_id,
					user_id: d.user_id,
					character_id: d.character_id
				}).update({ card_count: conn.raw(`card_count + ${d.count || 1}`) })
					.returning("*");
				
				loggers.info("directupdateCreateFodder: fodder updated", res);
				if (!res || res.length <= 0) {
					throw `Fodder not found ${d.character_id}, trying to create new fodder row`;
				}
				return res;
			} catch (err) {
				loggers.info("directUpdateCreateFodder: update failed, creating new cards", err);
				dataToInsert.push({
					user_id: d.user_id,
					character_id: d.character_id,
					rank: "platinum",
					rank_id: ranksMeta.platinum.rank_id,
					character_level: STARTER_CARD_LEVEL,
					exp: STARTER_CARD_EXP,
					r_exp: STARTER_CARD_R_EXP,
					card_count: d.count || 1,
					is_tradable: true,
					is_item: false,
					is_favorite: false,
					is_on_cooldown: false	
				});
			}
		})).then(async (res) => {
			const resp = res.flat().filter(x => x !== undefined);
			if (dataToInsert.length > 0) {
				const resultInserted = await Collections.create(dataToInsert);
				console.log({ resultInserted });
				resp.push(resultInserted);
				return resp;
			}
		});
	} catch (err) {
		loggers.error("CollectionsController.directUpdateOrCreateFodder: ERROR", err);
		return;
	}
};

/**
 * This function is used to normalize fodder ranks
 * with backward compatibility
 * @param fodders
 * @returns 
 */
export const updateOrCreateFodder = async (fodders: CollectionCreateProps[]) => {
	try {
		// normalize fooders to platinum rank
		const result = fodders.reduce((acc, r) => {
			acc[`${r.user_id}_${r.character_id}`] = (acc[`${r.user_id}_${r.character_id}`] || 0) + 1;
			return acc;
		}, {} as { [key: string]: number; });
		const preparedData = Object.keys(result).map((key) => {
			const ids = key.split("_");
			const user_id = +ids[0];
			const character_id = +ids[1];

			return {
				user_id,
				character_id,
				count: result[key]
			};
		});
		return directUpdateCreateFodder(preparedData);
	} catch (err) {
		loggers.error("CollectionsController.updateOrCreateFodder: ERROR", err);
		return;
	}
};

/**
 * Disclaimer: To directly create or update fodders if you already have count
 * use `directUpdateCreateFodder` function. This function will manually count each card
 * in the array so the count will be incorrect if it is not 1.
 * @param data
 * @returns 
 */
export const createCollection: (
  data: ICollectionCreateProps
) => Promise<CollectionProps[] | CollectionProps | undefined> = async function (
	data
) {
	try {
		if (!data) return;
		loggers.info("creating collection with data: ", data);
		/**
		 * IMPORTANT INFO
		 * - To reduce the data row size fodders are condensed into single rank
		 * while updating its count.
		 */
		let dataToInsert: CollectionCreateProps[] = [];
		let fodders: CollectionCreateProps[] = [];
		let result: any[] = [];
		if (Array.isArray(data)) {
			dataToInsert = data.filter((x) => !FODDER_RANKS.includes(x.rank));
			fodders = data.filter((x) => FODDER_RANKS.includes(x.rank));
		} else if (!FODDER_RANKS.includes(data.rank)) {
			dataToInsert = [ data ];
		} else {
			fodders = [ data ];
		}
		if (fodders.length > 0) {
			const fodderRes = await updateOrCreateFodder(fodders);
			if (fodderRes) {
				result = result.concat(fodderRes);
			}
		}
		if (dataToInsert.length > 0) {
			const cardRes = await Collections.create(dataToInsert);
			if (cardRes) {
				result = result.concat(cardRes);
			}
		}
		return result;
	} catch (err) {
		loggers.error(
			"api.controllers.CollectionsController.createCollection: ERROR",
			err
		);
		return;
	}
};

export const createItem = async (data: ICollectionItemCreateProps) => {
	try {
		loggers.info("creating items with data: ", data);
		return Collections.create(data);
	} catch (err) {
		loggers.error("CollectionsController.createItem: ERROR", err);
		return;
	}
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
				if (r.rank_division) {
					r.name = r.name + " " + MASTERY_TITLE[r.rank_division].emoji;
				}
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
						if (r.rank_division) {
							r.name = r.name + " " + MASTERY_TITLE[r.rank_division].emoji;
						}
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
		loggers.info("Updating Collection with: ", {
			params,
			data 
		});
		return Collections.update(params, data);
	} catch (err) {
		loggers.error(
			"api.controllers.CollectionsController.updateCollection: ERROR",
			err
		);
		return;
	}
};

export async function fetchCharacterDetails(filter: FilterProps) {
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
				if (c.rank_id === ranksMeta.ultimate.rank_id || c.rank_id === ranksMeta.mythical.rank_id) {
					const souls = getReqSouls(c.rank_id);
					const levelDifference = c.character_level - (ranksMeta.ultimate.max_level || 70);
					if (levelDifference < CHARACTER_LEVEL_EXTENDABLE_LIMIT) {
						const extraSouls = Math.ceil(levelDifference ** 1.57);
						reqSouls = souls + extraSouls;
					}
				}
				c.reqSouls = reqSouls;

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
			let cname = charactersData[index].name;
			if (res.rank_division && res.rank_division > 1) {
				cname = cname + " " + MASTERY_TITLE[res.rank_division].emoji;
			}
			return Object.assign(res, {
				name: cname,
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
		loggers.info("Deleting collections with: ", params);
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
		loggers.info("Verifying collections with: ", params);
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

export const getFoddersV2 = async (params: CollectionParams, filter: {
	limit: number;
	cond?: "gte" | "lte",
}) => {
	try {
		loggers.info("Fetching fodders v2 with:", params, filter);
		return Collections.getFoddersForEnchantmentV2(params, filter);
	} catch (err) {
		loggers.error("CollectionsController.getFoddersV2: ERROR", err);
		return;
	}
};

export const getTotalFodders = async (user_id: number) => {
	try {
		return Collections.getFodderCount(user_id);
	} catch (err) {
		loggers.error("Controllers.getTotalFodders: ERROR", err);
		return;
	}
};

export const groupCollectionsByCharacterId = async (user_id: number, character_ids: number[]) => {
	try {
		return Collections.groupByCharacterId(user_id, character_ids);
	} catch (err) {
		loggers.error("CollectionsController.groupCollectionsByCharacterId: ERROR", err);
		return;
	}
};