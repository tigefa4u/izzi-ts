import { NormalizeFloorProps } from "@customTypes/stages";
import Cache from "cache";
import { normalizeFloors } from "helpers";
import loggers from "loggers";
import * as Stages from "../models/Stages";

type IProps = { character_id: number }

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
		loggers.error("api.controllers.StagesController.getFloorsByCharacterId: something went wrong", err);
		return;
	}
};