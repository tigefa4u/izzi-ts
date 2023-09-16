import { CardParams, CardProps } from "@customTypes/cards";
import Cache from "cache";
import { RankProps } from "helpers/helperTypes";
import loggers from "loggers";
import * as Cards from "../models/Cards";

type CProps = CardProps[] | CardProps;

export const getCharacterCardByRank: (params: {
    character_id: number;
    rank: RankProps;
}) => Promise<CardProps | undefined> = async function(params) {
	try {
		const key = `card::ch-${params.character_id}:${params.rank}`;
		const result = await Cache.fetch<CardProps>(key, async () => {
			let res: CProps = await Cards.get(params);
			res = res[0];
			return res;
		});
		return result;
	} catch (err) {
		loggers.error("api.controllers.CardsController.getCharacterByRank: ERROR ", err);
		return;
	}
};

export const getCardBySeries: (params: {
	series: string;
}) => Promise<CardProps[] | undefined> = async function(params) {
	try {
		return Cards.getBySeries(params);
	} catch (err) {
		loggers.error("api.controllers.CardsController.getCardBySeries: ERROR", err);
		return;
	}
};

export const getRandomCard = async (params: CardParams & {
	group_with?: number;
	group_id?: number;
}, limit: number) => {
	try {
		return Cards.getRandomCard(params, limit);
	} catch (err) {
		loggers.error("api.controllers.CardsController.getRandomCard: ERROR", err);
		return;
	}
};