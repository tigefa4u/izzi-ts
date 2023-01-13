import { SkinProps } from "@customTypes/skins";
import Cache from "cache";
import loggers from "loggers";
import * as Skins from "../models/Skins";

export const getSkinById = async (params: Pick<SkinProps, "id">): Promise<SkinProps | undefined> => {
	try {
		const key = `skin::${params.id}`;
		const result = await Cache.fetch(key, async () => {
			const resp = await Skins.get({ id: params.id });
			return resp[0];
		});

		return result;
	} catch (err) {
		loggers.error("api.controllers.SkinsController.getSkin: ERROR", err);
		return;
	}
};

export const getSkinByCharacterId = async (params: { character_id: number | number[]; }) => {
	try {
		return Skins.getByCharacterId(params);
	} catch (err) {
		loggers.error("api.controllers.SkinsController.getSkinByCharacterId: ERROR", err);
		return;
	}
};