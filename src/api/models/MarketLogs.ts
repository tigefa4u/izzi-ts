import { MarketLogCreateProps, MarketLogProps } from "@customTypes/market";
import connection from "db";

const tableName = "market_logs";
export const transformation = {
	id: {
		type: "number",
		autoIncrements: true,
	},
	characterId: {
		type: "number",
		columnName: "character_id",
	},
	rankId: {
		type: "number",
		columnName: "rank_id",
	},
	sold_at_cost: {
		type: "number",
		columnName: "sold_at_cost",
	},
	metadata: { type: "jsonb" },
};

type P = {
    characterId: number;
    rankId: number;
}
export const getByCharacterAndRankId = async (params: P): Promise<MarketLogProps[]> => {
	return connection
		.select("id", "character_id", "rank_id", "sold_at_cost", "metadata")
		.from(tableName)
		.where({
			character_id: params.characterId,
			rank_id: params.rankId,
		});
};

export const create = async (data: MarketLogCreateProps) => {
	return connection(tableName).insert(data);
};

export const getAveragePriceOfCharacterAndRankId = async (params: P) => {
	return connection(tableName).avg("sold_at_cost").where({
		character_id: params.characterId,
		rank_id: params.rankId
	});
};