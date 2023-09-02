import { DungeonCreateProps, DungeonUpdateProps } from "@customTypes/dungeon";
import loggers from "loggers";
import * as Dungeons from "../models/Dungeons";

export const createDGTeam = async (data: DungeonCreateProps) => {
	try {
		loggers.info("api.controllers.DungeonsController.createDGTeam: creating DG Team with data ", 
			data);
		return Dungeons.create(data);
	} catch (err) {
		loggers.error("api.controllers.DungeonsController.createDGTeam: ERROR", err);
		return;
	}
};

export const updateDGTeam = async (user_tag: string, data: DungeonUpdateProps) => {
	try {
		loggers.info("api.controllers.DungeonsController.updateDGTeam: ", 
			data);
		return Dungeons.update(user_tag, data);
	} catch (err) {
		loggers.error("api.controllers.DungeonsController.updateDGTeam: ERROR", err);
		return;
	}
};

export const getDGTeam = async (user_tag: string) => {
	try {
		return Dungeons.get(user_tag);
	} catch (err) {
		loggers.error("api.controllers.DungeonsController.getDGTeam: ERROR", err);
		return;
	}
};

export const delDGTeam = async (user_tag: string) => {
	try {
		loggers.info("api.controllers.DungeonsController.delDGTeam: deleting DG Team: " + user_tag);
		return Dungeons.del(user_tag);
	} catch (err) {
		loggers.error("api.controllers.DungeonsController.delDGTeam: ERROR", err);
		return;
	}  
};

export const getRandomDGOpponent = async (params: {
    exclude_tag: string;
    mmr: number;
}) => {
	try {
		loggers.info("DungeonsController.getRandomDGOpponent: fetch player with mmr:", params);
		const result = await Dungeons.getRandomPlayer(params);
		return result[0];
	} catch (err) {
		loggers.error("api.controllers.DungeonsController.getRandomDGOpponent: ERROR", err);
		return;
	}
};