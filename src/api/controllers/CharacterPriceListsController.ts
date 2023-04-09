import { CharacterPriceListCreateProps } from "@customTypes/characters";
import loggers from "loggers";
import * as Model from "../models/CharacterPriceList";

type P = {
	characterId: number;
	rankId: number;
}
export const getCharacterPriceList = async (params: P) => {
	try {
		const result = await Model.getByCharacterAndRankId(params);
		return result[0];
	} catch (err) {
		loggers.error("api.controllers.CharacterPriceListsController: ERROR", err);
		return;
	}
};

export const createCharacterPriceList = async (data: CharacterPriceListCreateProps) => {
	try {
		loggers.info("Creating character price list -> ", { data });
		return Model.create(data);
	} catch (err) {
		loggers.error("api.controllers.createCharacterPriceList: ERROR", err);
		return;
	}
};

export const updateCharacterAvgPrice = async (params: { id: number; price: number; }) => {
	try {
		loggers.info("Updating character avg market price -> ", params);
		return Model.updateAveragePrice(params);
	} catch (err) {
		loggers.error("api.controllers.updateCharacterAvgPrice: ERROR", err);
		return;
	}	
};