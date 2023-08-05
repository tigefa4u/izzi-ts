import { MarketLogCreateProps, MarketLogProps } from "@customTypes/market";
import connection from "db";

/**
 * Market Logs - Model
 * This table 
 * 
 */



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
	soldAtCost: {
		type: "number",
		columnName: "sold_at_cost",
	},
	taxPaid: {
		type: "number",
		columnName: "tax_paid"
	},
	userTag: {
		type: "string",
		columnName: "user_tag"
		// Seller user tag
	},
	metadata: { type: "jsonb" },
};

type P = {
    characterId: number;
    rankId: number;
}
export const getByCharacterAndRankId = async (params: P): Promise<MarketLogProps[]> => {
	return connection
		.select("id", "character_id", "rank_id", "sold_at_cost", "metadata", "tax_paid")
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

export const getYearlyTotalTaxPaid = async (params: { user_tag: string; }): Promise<any> => {
	const dt = new Date();
	// fetch tax paid from 12 months
	dt.setDate(1);
	const fromDate = new Date(dt.setMonth(dt.getMonth() - 12));
	return connection(tableName)
		.count()
		.sum("tax_paid")
		.where({ user_tag: params.user_tag })
		.where("created_at", ">=", fromDate)
		.then(res => res[0]);
};
