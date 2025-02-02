import { CardMetadataProps } from "@customTypes/cards";
import {
	CollectionCardInfoByRowNumberParams,
	CollectionCardInfoProps,
} from "@customTypes/collections";
import { SkinProps } from "@customTypes/skins";
import { SortProps } from "@customTypes/sorting";
import { MASTERY_TITLE } from "helpers/constants/rankConstants";
import loggers from "loggers";
import { getSkinArr } from "modules/commands/rpg/skins/skinCache";
import * as Collections from "../models/Collections";
import { getCharacterInfo } from "./CharactersController";
import { getItemById } from "./ItemsController";
import { getByRowNumber as getDzInvByRowNumber } from "../models/DarkZoneInventory";

export const getCardInfoByRowNumber = async (
	params: CollectionCardInfoByRowNumberParams & { isDarkZone?: boolean; },
	sort?: SortProps
): Promise<CollectionCardInfoProps[] | undefined> => {
	try {
		if (!params.row_number) {
			return;
		} else if (
			typeof params.row_number === "object" &&
      params.row_number.length <= 0 &&
      !params.row_number.every(Number)
		) {
			return;
		}
		let skinArr: undefined | SkinProps[];
		if (params.user_tag) {
			skinArr = await getSkinArr(params.user_tag);
		}
		if (typeof params.row_number === "number") {
			params.row_number = [ params.row_number ];
		}
		const result = await Promise.all(params.row_number.map((num) => {
			if (params.isDarkZone) {
				return getDzInvByRowNumber({
					...params,
					row_number: num,
					sort,
					user_tag: params.user_tag || ""
				});
			} else {
				return Collections.getByRowNumber({
					...params,
					row_number: num,
					sort
				});
			}
		})).then((res) => res.flat());

		if (result.length > 0) {
			const resp: CollectionCardInfoProps[] = await Promise.all(
				result.map(async (data: any) => {
					const charainfo = await getCharacterInfo({
						ids: [ data.character_id ],
						rank: data.rank,
					});
					if (!charainfo || charainfo.length <= 0) {
						throw new Error("Character not found for id: " + data.character_id);
					}
					const characterInfo = charainfo[0];
					characterInfo.metadata = {
						...characterInfo.metadata,
						...data.metadata,
					} as CardMetadataProps;
					if (skinArr) {
						const idx = skinArr.findIndex(
							(s) => s.character_id === characterInfo.character_id
						);
						if (idx >= 0) {
							characterInfo.filepath = skinArr[idx].filepath;
							if (skinArr[idx].metadata?.assets) {
								const skinMeta = {
									...skinArr[idx].metadata,
									assets: (skinArr[idx].metadata.assets || {} as any)[
										characterInfo.rank
									],
								};
								characterInfo.metadata = {
									...data.metadata,
									...skinMeta,
								};
							}
						}
					}
					let itemOptions = {};
					if (data.item_id) {
						const item = await getItemById({ id: data.item_id });
						if (item) {
							itemOptions = {
								itemname: item.name,
								itemdescription: item.description,
							};
						}
					}
					if (data.rank_division) {
						characterInfo.name = characterInfo.name + " " + MASTERY_TITLE[data.rank_division].emoji;
					}
					const res = Object.assign(data, {
						name: characterInfo.name,
						stats: params.isDarkZone ? data.stats : characterInfo.stats,
						type: characterInfo.type,
						abilityname: characterInfo.abilityname,
						abilitydescription: characterInfo.abilitydescription,
						filepath: characterInfo.filepath,
						is_passive: characterInfo.is_passive,
						metadata: characterInfo.metadata,
						...itemOptions,
						characterInfo,
					}) as CollectionCardInfoProps;
					return res;
				})
			);

			return resp;
		}
	} catch (err) {
		loggers.error(
			"api.controllers.CollectionInfoController.getCardInfoByRowNumber: ERROR",
			err
		);
		return;
	}
};

export const getCollectionById = async (params: {
  id?: number;
  user_id: number;
  ids?: number[];
  user_tag?: string;
  isDungeon?: boolean;
}) => {
	try {
		let skinArr: undefined | SkinProps[];
		if (params.user_tag) {
			skinArr = await getSkinArr(params.user_tag);
		}
		const result = await Collections.get(params);
		if (result.length > 0) {
			const resp: CollectionCardInfoProps[] = await Promise.all(
				result.map(async (data) => {
					const charaInfo = await getCharacterInfo({
						ids: [ data.character_id ],
						rank: data.rank,
					});
					if (!charaInfo || charaInfo.length <= 0) {
						throw new Error("Character not found for id: " + data.character_id);
					}
					const characterInfo = charaInfo[0];
					characterInfo.metadata = {
						...characterInfo.metadata,
						...data.metadata,
					} as CardMetadataProps;
					if (skinArr) {
						const idx = skinArr.findIndex(
							(s) => s.character_id === characterInfo.character_id
						);
						if (idx >= 0) {
							characterInfo.filepath = skinArr[idx].filepath;
							if (skinArr[idx].metadata?.assets) {
								const skinMeta = {
									...skinArr[idx].metadata,
									assets: (skinArr[idx].metadata.assets || {} as any)[
										characterInfo.rank
									],
								};
								characterInfo.metadata = {
									...characterInfo.metadata,
									...skinMeta,
								};
							}
						}
					}
					let itemOptions = {};
					
					// Do not fetch the item equipped on card for dg
					if (data.item_id && !params.isDungeon) {
						const item = await getItemById({ id: data.item_id });
						if (item) {
							itemOptions = {
								itemname: item.name,
								itemdescription: item.description,
								itemStats: item.stats,
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
						metadata: characterInfo.metadata,
						is_passive: characterInfo.is_passive,
						...itemOptions,
						characterInfo,
					});
					return res;
				})
			);

			return resp;
		}
	} catch (err) {
		loggers.error(
			"api.controllers.CollectionInfoController.getCollectionById: ERROR",
			err
		);
		return;
	}
};

export const getCardForBattle = async (params: {
  id: number;
  user_id: number;
  user_tag: string;
}) => {
	try {
		let skinArr: undefined | SkinProps[];
		if (params.user_tag) {
			skinArr = await getSkinArr(params.user_tag);
		}
		const result = await Collections.get(params);
		if (result.length > 0) {
			const data = result[0];
			const charaInfo = await getCharacterInfo({
				ids: [ data.character_id ],
				rank: data.rank,
			});
			if (!charaInfo || charaInfo.length <= 0) {
				throw new Error("Character not found for id: " + data.character_id);
			}
			const characterInfo = charaInfo[0];
			characterInfo.name = data.metadata?.nickname || characterInfo.name;
			if (skinArr) {
				const idx = skinArr.findIndex(
					(s) => s.character_id === characterInfo.character_id
				);
				if (idx >= 0) {
					characterInfo.filepath = skinArr[idx].filepath;
					if (skinArr[idx].metadata?.assets) {
						const skinMeta = {
							...skinArr[idx].metadata,
							assets: (skinArr[idx].metadata.assets || {} as any)[characterInfo.rank],
						};
						characterInfo.metadata = skinMeta;
					}
				}
			}
			let itemOptions = {};
			if (data.item_id) {
				const item = await getItemById({ id: data.item_id });
				if (item) {
					itemOptions = {
						itemname: item.name,
						itemdescription: item.description,
						itemStats: item.stats,
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
				metadata: characterInfo.metadata,
				...itemOptions,
			});
			return res;
		}
	} catch (err) {
		loggers.error(
			"api.controllers.CollectionInfoController.getCardForBattle: ERROR",
			err
		);
		return;
	}
};
