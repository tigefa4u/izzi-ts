import { FilterProps, ResponseWithPagination } from "@customTypes";
import { CardMetadataProps } from "@customTypes/cards";
import { CollectionCardInfoProps } from "@customTypes/collections";
import {
	CreateDarkZoneInvProps,
	DarkZoneInvUpdateProps,
	DzInventoryReturnType,
} from "@customTypes/darkZone/inventory";
import { PageProps } from "@customTypes/pagination";
import { SortProps } from "@customTypes/sorting";
import { paginationForResult, paginationParams } from "helpers/pagination";
import loggers from "loggers";
import { getSkinArr } from "modules/commands/rpg/skins/skinCache";
import * as Model from "../models/DarkZoneInventory";
import { getCharacterInfo } from "./CharactersController";
import { fetchCharacterDetails } from "./CollectionsController";

type C = {
  id: number;
  abilityname: string;
  abilitydescription: string;
  name: string;
  type: string;
};
type T = { user_tag: string };
export const getDzInventory = async (
	filter: Omit<FilterProps, "category" | "ids"> & T,
	pageProps: PageProps,
	sort?: SortProps
): Promise<ResponseWithPagination<DzInventoryReturnType[]> | undefined> => {
	try {
		let charactersData = [] as C[];
		if (filter.name || filter.type || filter.abilityname || filter.series) {
			charactersData = await fetchCharacterDetails(filter);
		}
		if (charactersData.length > 0) {
			Object.assign(filter, { character_ids: charactersData.map((c) => c.id) });
		}
		const result = await Model.getAll(
			filter,
			await paginationParams(pageProps),
			sort
		);
		if (charactersData.length <= 0) {
			charactersData = await fetchCharacterDetails({ ids: result.map((r) => r.character_id), });
		}
		const pagination = await paginationForResult({
			data: result,
			query: pageProps,
		});
		const resp = result.map((res) => {
			const character = charactersData.find((c) => c.id === res.character_id);
			return Object.assign(res, {
				name: character?.name || "",
				abilityname: character?.abilityname || "",
				abilitydescription: character?.abilitydescription || "",
				type: character?.type || "",
			});
		});

		return {
			data: resp,
			metadata: pagination,
		};
	} catch (err) {
		loggers.error("DarkZoneInventoryController.getDzInventory: ERROR", err);
		return;
	}
};

export const createDzInventory = async (data: CreateDarkZoneInvProps) => {
	try {
		loggers.info("createDzInventory: creating inv with data: ", { data });
		return Model.create(data);
	} catch (err) {
		loggers.error("DarkZoneInventoryController.createDzInventory: ERROR", err);
		return;
	}
};

export const getDzInvById = async (params: {
	id: number | number[];
	user_tag?: string;
	is_on_market?: boolean;
}) => {
	try {
		return Model.getById(params);
	} catch (err) {
		loggers.error("DarkZoneInventoryController.getDzInvById: ERROR", err);
		return;
	}
};

export const updateDzInv = async (
	params: {
    id: number | number[];
    user_tag: string;
  },
	data: DarkZoneInvUpdateProps
) => {
	try {
		loggers.info(
			"updateDzInv: updating dz inv with params and data: ",
			params,
			data
		);
		return Model.update(
			{
				id: params.id,
				user_tag: params.user_tag,
			},
			data
		);
	} catch (err) {
		loggers.error("DarkZoneInventoryController.updateDzInv: ERROR", err);
		return;
	}
};

export const getDzInvByIdForBattle = async (
	id: number[],
	user_tag: string
): Promise<CollectionCardInfoProps[] | undefined> => {
	try {
		const skinArr = await getSkinArr(user_tag);
		const result = await Model.getById({
			id,
			user_tag 
		});
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
									assets: (skinArr[idx].metadata.assets || ({} as any))[
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
					const res = Object.assign(data, {
						name: characterInfo.name,
						stats: data.stats,
						type: characterInfo.type,
						abilityname: characterInfo.abilityname,
						abilitydescription: characterInfo.abilitydescription,
						filepath: characterInfo.filepath,
						metadata: characterInfo.metadata,
						is_passive: characterInfo.is_passive,
						characterInfo,
					}) as any;
					return res;
				})
			);

			return resp;
		}
	} catch (err) {
		loggers.error(
			"DarkZoneInventoryController.getDzInvByIdForBattle: ERROR",
			err
		);
		return;
	}
};
