import { BattleCardProps, NormalizeFloorProps } from "@customTypes/stages";
import Cache from "cache";
import { normalizeFloors } from "helpers";
import loggers from "loggers";
import * as Stages from "../models/Stages";
import { getCharacterCardByRank } from "./CardsController";
import { getCharacterById, getCharacterInfo } from "./CharactersController";

type IProps = { character_id: number }
type SProps = { location_id: number; floor: number; }

export const getFloorsByCharacterId: (params: IProps) => Promise<NormalizeFloorProps | undefined> = async (params) => {
	try {
		const key = "floors::ch-" + params.character_id;
		const characterFloors = await Cache.get(key);
		if (characterFloors) return JSON.parse(characterFloors);
		else {
			const result = await Stages.getFloorsBycharacterId(params);
			const normalizedFloors = normalizeFloors(result);
			await Cache.set(key, JSON.stringify(normalizedFloors));
			return normalizedFloors;
		}
	} catch (err) {
		loggers.error("api.controllers.StagesController.getFloorsByCharacterId(): something went wrong", err);
		return;
	}
};

export const getStageForBattle = async (params: SProps): Promise<BattleCardProps | undefined> => {
	try {
		const key = `stage::${params.location_id}-${params.floor}`;
		const result = await Cache.fetch<BattleCardProps | undefined>(key, async () => {
			const res = await Stages.getStageForBattle(params.location_id, params.floor);
			const character = await getCharacterById({ id: res.character_id });
			if (!character) return;
			const card = await getCharacterCardByRank({
				character_id: character.id,
				rank: res.rank
			});
			if (!card) return;
			const stageInfo: BattleCardProps = Object.assign({}, {
				...res,
				...character,
				...card,
				zone_filepath: res.filepath,
			});
			return stageInfo;
		});

		return result;
	} catch (err) {
		loggers.error("api.controllers.StagesController.getStageForBattle(): something went wrong", err);
		return;
	}
};