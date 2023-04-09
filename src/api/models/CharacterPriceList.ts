import {
	CharacterPriceListCreateProps,
	CharacterPriceListProps,
} from "@customTypes/characters";
import connection from "db";

const tableName = "character_price_lists";
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
	averageMarketPrice: {
		type: "number",
		columnName: "average_market_price",
	},
	metadata: { type: "jsonb" },
};

export const getByCharacterAndRankId = (params: {
  characterId: number;
  rankId: number;
}): Promise<CharacterPriceListProps[]> => {
	return connection
		.select("id", "character_id", "rank_id", "average_market_price", "metadata")
		.from(tableName)
		.where({
			character_id: params.characterId,
			rank_id: params.rankId,
		});
};

export const create = (data: CharacterPriceListCreateProps) => {
	return connection(tableName).insert(data);
};

export const updateAveragePrice = (params: { id: number; price: number }) => {
	return connection(tableName)
		.where({ id: params.id })
		.update({ average_market_price: params.price });
};
