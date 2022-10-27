import { CardSpawnCreateProps, CardSpawnUpdateProps } from "@customTypes/cardSpawns";
import loggers from "loggers";
import * as CardSpawns from "../models/CardSpawns";

export const getCardDropChannels = async (params: { guild_id: string }) => {
	try {
		const result = await CardSpawns.get(params);
		return result[0];
	} catch (err) {
		loggers.error(
			"api.controllers.CardSpawnsController.getCardDropChannels: ERROR",
			err
		);
		return;
	}
};

export const createDropChannels = async (
	data: CardSpawnCreateProps,
) => {
	try {
		return CardSpawns.create(data);
	} catch (err) {
		loggers.error(
			"api.controllers.CardSpawnsController.createDropChannels: ERROR",
			err
		);
		return;
	}
};

export const updateDropChannels = async (params: { id?: number; guild_id?: string }, data: CardSpawnUpdateProps) => {
	try {
		return CardSpawns.update(params, data);
	} catch (err) {
		loggers.error(
			"api.controllers.CardSpawnsController.updateDropChannels: ERROR",
			err
		);
		return;
	}
};

export const delDropChannels = async (params: { id: number }) => {
	try {
		return CardSpawns.del(params);
	} catch (err) {
		loggers.error(
			"api.controllers.CardSpawnsController.delDropChannels: ERROR",
			err
		);
		return;
	}
};