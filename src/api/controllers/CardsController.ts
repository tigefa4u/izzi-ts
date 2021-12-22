import { CardProps } from "@customTypes/cards";
import Cache from "cache";
import loggers from "loggers";
import * as Cards from "../models/Cards";

type CProps = CardProps[] | CardProps | string | null;

export const getCharacterCardByRank: (params: {
    character_id: number;
    rank: string;
}) => Promise<CardProps> = async function(params) {
	try {
		const key = `card::ch-${params.character_id}:${params.rank}`;
		let result: CProps = await Cache.get(key);
		if (result) return JSON.parse(result);
		else {
			result = await Cards.get(params);
			result = result[0];
			await Cache.set(key, JSON.stringify(result));
		}
		return result;
	} catch (err) {
		loggers.error("api.controllers.CardsController.getCharacterByRank: something went wrong ", err);
		return;
	}
};