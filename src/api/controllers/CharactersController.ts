import { FilterProps, ResponseWithPagination } from "@customTypes";
import {
	CharacterCardProps,
	CharacterDetailsProps,
	CharactersReturnType,
} from "@customTypes/characters";
import loggers from "loggers";
import * as Characters from "../models/Characters";
import { getCharacterCardByRank } from "./CardsController";
import { BASE_RANK } from "helpers/constants/constants";
import { getBySeries } from "api/models/Cards";
import { PageProps } from "@customTypes/pagination";
import { paginationForResult, paginationParams } from "helpers/pagination";

export const getCharacterById: (params: {
  id: number;
}) => Promise<CharacterDetailsProps | undefined> = async function (params) {
	try {
		return Characters.getCharacterById(params);
	} catch (err) {
		loggers.error(
			"api.controllers.getCharacterById: ERROR ",
			err
		);
		return;
	}
};

export const getCharacters: (
  params: FilterProps
) => Promise<CharactersReturnType> = async function (params: FilterProps) {
	try {
		return Characters.get(params);
	} catch (err) {
		loggers.error(
			"api.controllers.getCharacters: ERROR for params:- ",
			params,
			err
		);
		return [];
	}
};

export const getCharacterInfo: (
  filter: FilterProps & { isExactMatch?: boolean; }
) => Promise<CharacterCardProps[] | undefined> = async function (filter) {
	try {
		const result = await Characters.get(filter);
		if (result && result.length > 0) {
			const allCharacters = await Promise.all(result.map(async (r) => {
				const characterInfo:
			  | CharacterCardProps
			  | PromiseLike<CharacterCardProps | undefined>
			  | undefined = {} as CharacterCardProps;
				const character = r;
				let rank = BASE_RANK;
				if (typeof filter.rank === "string") {
					rank = filter.rank;
				} else if (typeof filter.rank === "object") {
					rank = filter.rank[0];
				}
				const card = await getCharacterCardByRank({
					character_id: character.id,
					rank: rank,
				});
				Object.assign(characterInfo, {
					...card,
					...character,
				});
				return characterInfo;
			}));
			return allCharacters;
		}
		return;
	} catch (err) {
		loggers.error(
			"api.controllers.getCharacterInfo: ERROR",
			err
		);
		return;
	}
};

export const getDex: (
  filter: Pick<FilterProps, "abilityname" | "series" | "type">,
  pageProps: PageProps
) => Promise<ResponseWithPagination<CharacterDetailsProps[]> | undefined> = async function (filter, pageProps) {
	try {
		let character_ids: number[] = [];
		if (filter.series) {
			const cards = await getBySeries({ series: filter.series });
			character_ids = cards.map((ca) => ca.character_id);
		}
		const result = await Characters.getCharactersForDex({
			ids: character_ids,
			...filter 
		}, 
		await paginationParams(pageProps));
		const pagination = await paginationForResult<CharacterDetailsProps>({
			data: result,
			query: pageProps
		});
		return {
			data: result,
			metadata: pagination
		};
	} catch (err) {
		loggers.error(
			"api.controllers.CharactersController.getDex: ERROR",
			err
		);
		return;
	}
};

export const updateCharacterNameById = (id: number, name: string) => {
	try {
		return Characters.updateName(id, name);
	} catch (err) {
		loggers.error("api.controllers.CharactersController.updateCharacterNameById: ERROR", err);
		return;
	}
};