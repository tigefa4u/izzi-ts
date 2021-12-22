import { FilterProps } from "@customTypes";
import {
	CharacterCardProps,
	CharacterDetailsProps,
	CharactersReturnType,
} from "@customTypes/characters";
import loggers from "loggers";
import * as Characters from "../models/Characters";
import { getCharacterCardByRank } from "./CardsController";
import { BASE_RANK } from "helpers/constants";

export const getCharacterById: (params: {
  id: string;
}) => Promise<CharacterDetailsProps | undefined> = async function (params) {
	try {
		return await Characters.getCharacterById(params);
	} catch (err) {
		loggers.error(
			"api.controllers.getCharacterById: something went wrong ",
			err
		);
		return;
	}
};

export const getCharacters: (
  params: FilterProps
) => Promise<CharactersReturnType> = async function (params: FilterProps) {
	try {
		return await Characters.getCharacters(params);
	} catch (err) {
		loggers.error(
			"api.controllers.getCharacters: something went wrong for params:- " +
        JSON.stringify(params),
			err
		);
		return;
	}
};

export const getCharacterInfo: (
  filter: FilterProps
) => Promise<CharacterCardProps | undefined> = async function (filter) {
	try {
		const characterInfo:
      | CharacterCardProps
      | PromiseLike<CharacterCardProps | undefined>
      | undefined = {} as CharacterCardProps;
		const result = await Characters.getCharacters(filter);
		if (result && result.length > 0) {
			const character = result[0];
			const card = await getCharacterCardByRank({
				character_id: character.id,
				rank: BASE_RANK,
			});
			Object.assign(characterInfo, {
				...card,
				...character,
			});
		}
		return characterInfo;
	} catch (err) {
		loggers.error(
			"api.controllers.getCharacterInfo: something went wrong",
			err
		);
		return;
	}
};

export const getDex: (filter: Pick<FilterProps, "abilityname" | "series">) => Promise<any> = async function(filter) {
    try {

    } catch (err) {
        loggers.error("api.controllers.CharactersController.getDex: something went wrong", err)
        return;
    }
}
