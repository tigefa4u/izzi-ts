import { CollectionCardInfoByRowNumberParams, CollectionCardInfoProps } from "@customTypes/collections";
import { SkinProps } from "@customTypes/skins";
import loggers from "loggers";
import { getSkinArr } from "modules/commands/rpg/skins/skinCache";
import * as Collections from "../models/Collections";
import { getCharacterInfo } from "./CharactersController";
import { getItemById } from "./ItemsController";

export const getCardInfoByRowNumber = async (
	params: CollectionCardInfoByRowNumberParams
): Promise<CollectionCardInfoProps[] | undefined> => {
	try {
		let skinArr: undefined | SkinProps[];
		if (params.user_tag) {
			skinArr = getSkinArr(params.user_tag);
		}
		const result = await Collections.getByRowNumber(params);
		if (result.length > 0) {
			const resp: CollectionCardInfoProps[] = await Promise.all(result.map(async (data) => {
				const characterInfo = await getCharacterInfo({
					ids: [ data.character_id ],
					rank: data.rank 
				});
				if (!characterInfo) {
					throw new Error("Character not found for id: " + data.character_id);
				}
				if (skinArr) {
					const idx = skinArr.findIndex((s) => s.character_id === characterInfo.character_id);
					if (idx >= 0) {
						characterInfo.filepath = skinArr[idx].filepath;
					}
				}
				let itemOptions = {};
				if (data.item_id) {
					const item = await getItemById({ id: data.item_id });
					if (item) {
						itemOptions = {
							itemname: item.name,
							itemdescription: item.description
						};
					}
				}
				const res: CollectionCardInfoProps = Object.assign(data, {
					name: characterInfo.name,
					stats: characterInfo.stats,
					type: characterInfo.type,
					abilityname: characterInfo.abilityname,
					abilitydescription: characterInfo.abilitydescription,
					filepath: characterInfo.filepath,
					is_passive: characterInfo.is_passive,
					...itemOptions,
					characterInfo
				});
				return res;
			}));

			return resp;
		}
	} catch (err) {
		loggers.error("api.controllers.CollectionInfoController.getCardInfoByRowNumber(): something went wrong", err);
		return;
	}
};

export const getCollectionById = async (
	params: { id?: number; user_id: number; ids?: number[]; user_tag?: string; }
) => {
	try {
		let skinArr: undefined | SkinProps[];
		if (params.user_tag) {
			skinArr = getSkinArr(params.user_tag);
		}
		const result = await Collections.get(params);
		if (result.length > 0) {
			const resp: CollectionCardInfoProps[] = await Promise.all(result.map(async (data) => {
				const characterInfo = await getCharacterInfo({
					ids: [ data.character_id ],
					rank: data.rank 
				});
				if (!characterInfo) {
					throw new Error("Character not found for id: " + data.character_id);
				}
				if (skinArr) {
					const idx = skinArr.findIndex((s) => s.character_id === characterInfo.character_id);
					if (idx >= 0) {
						characterInfo.filepath = skinArr[idx].filepath;
					}
				}
				let itemOptions = {};
				if (data.item_id) {
					const item = await getItemById({ id: data.item_id });
					if (item) {
						itemOptions = {
							itemname: item.name,
							itemdescription: item.description
						};
					}
				}
				const res: CollectionCardInfoProps = Object.assign(data, {
					name: characterInfo.name,
					stats: characterInfo.stats,
					type: characterInfo.type,
					abilityname: characterInfo.abilityname,
					abilitydescription: characterInfo.abilitydescription,
					filepath: characterInfo.filepath,
					is_passive: characterInfo.is_passive,
					...itemOptions,
					characterInfo
				});
				return res;
			}));

			return resp;
		}
	} catch (err) {
		loggers.error("api.controllers.CollectionInfoController.getCollectionById(): something went wrong", err);
		return;
	}
};

export const getCardForBattle = async (
	params: { id: number; user_id: number; }
) => {
	try {
		const result = await Collections.get(params);
		if (result.length > 0) {
			const data = result[0];
			const characterInfo = await getCharacterInfo({
				ids: [ data.character_id ],
				rank: data.rank 
			});
			if (!characterInfo) {
				throw new Error("Character not found for id: " + data.character_id);
			}
			let itemOptions = {};
			if (data.item_id) {
				const item = await getItemById({ id: data.item_id });
				if (item) {
					itemOptions = {
						itemname: item.name,
						itemdescription: item.description,
						itemStats: item.stats
					};
				}
			}
			const res: CollectionCardInfoProps = Object.assign(data, {
				name: characterInfo.name,
				stats: characterInfo.stats,
				type: characterInfo.type,
				abilityname: characterInfo.abilityname,
				abilitydescription: characterInfo.abilitydescription,
				filepath: characterInfo.filepath,
				...itemOptions,
			});
			return res;
		}
	} catch (err) {
		loggers.error("api.controllers.CollectionInfoController.getCardForBattle(): something went wrong", err);
		return;
	}
};