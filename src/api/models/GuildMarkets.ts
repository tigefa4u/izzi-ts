import { GuildMarketProps } from "@customTypes/guildMarkets";
import { PaginationProps } from "@customTypes/pagination";
import connection from "db";

const tableName = "guild_markets";
export const transformation = {
	id: {
		type: "number",
		autoIncrement: true,
	},
	name: { type: "string", },
	price: { type: "number", },
	stats: { type: "json", },
	description: { type: "string" },
	createdAt: {
		columnName: "created_at",
		type: "timestamp",
	},
	updatedAt: {
		columnName: "updated_at",
		type: "timestamp",
	},
};

export const get = async (params: { id: number }): Promise<GuildMarketProps[]> => {
	const db = connection;
	const query = db.select("*")
		.from(tableName)
		.where(params);

	return query;
};

export const getAll = async (params: { ids?: number[] }, pagination: PaginationProps = {
	limit: 10,
	offset: 0
}): Promise<GuildMarketProps[]> => {
	const db = connection;
	let query = db.select(db.raw(`${tableName}.*, count(*) over() as total_count`))
		.from(tableName);

	if (params.ids) {
		query = query.whereIn(`${tableName}.id`, params.ids);
	}
	
	query = query
		.limit(pagination.limit)
		.offset(pagination.offset);

	return query;
};