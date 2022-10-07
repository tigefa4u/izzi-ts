import { CardMetadataProps } from "@customTypes/cards";
import {
	CollectionCardInfoByRowNumberParams,
	CollectionCardInfoProps,
} from "@customTypes/collections";
import { SkinProps } from "@customTypes/skins";
import { SortProps } from "@customTypes/sorting";
import loggers from "loggers";
import { getSkinArr } from "modules/commands/rpg/skins/skinCache";
import * as Collections from "../models/Collections";
import { getCharacterInfo } from "./CharactersController";
import { getItemById } from "./ItemsController";

export const getCardInfoByRowNumber = async (
	params: CollectionCardInfoByRowNumberParams,
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
		const result = await Collections.getByRowNumber({
			...params,
			sort
		});
		if (result.length > 0) {
			const resp: CollectionCardInfoProps[] = await Promise.all(
				result.map(async (data) => {
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
					const res: CollectionCardInfoProps = Object.assign(data, {
						name: characterInfo.name,
						stats: characterInfo.stats,
						type: characterInfo.type,
						abilityname: characterInfo.abilityname,
						abilitydescription: characterInfo.abilitydescription,
						filepath: characterInfo.filepath,
						is_passive: characterInfo.is_passive,
						metadata: characterInfo.metadata,
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
			"api.controllers.CollectionInfoController.getCardInfoByRowNumber(): something went wrong",
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
			"api.controllers.CollectionInfoController.getCollectionById(): something went wrong",
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
			"api.controllers.CollectionInfoController.getCardForBattle(): something went wrong",
			err
		);
		return;
	}
};
