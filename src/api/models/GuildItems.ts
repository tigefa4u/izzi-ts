import { GuildItemCreateProps, GuildItemParams, GuildItemResponseProps } from "@customTypes/guildItems";
import { PaginationProps } from "@customTypes/pagination";
import connection from "db";
import { clone } from "utility";

const tableName = "guild_items";
const guildMarkets = "guild_markets";
export const transformation = {
	id: {
		type: "number",
		autoIncrement: true,
	},
	itemId: {
		columnName: "item_id",
		type: "number",
		ref: "guild_markets",
	},
	guildId: {
		columnName: "guild_id",
		type: "number",
		ref: "guilds",
	},
	quantity: { type: "number", },
	createdAt: {
		columnName: "created_at",
		type: "timestamp",
	},
	updatedAt: {
		columnName: "updated_at",
		type: "timestamp",
	},
};

export const del = async (params: GuildItemParams) => {
	return await connection(tableName).where(params).del();
};

export const get = async (params: GuildItemParams): Promise<GuildItemResponseProps[]> => {
	const db = connection;
	let query = db.select(db.raw(`${tableName}.*, ${guildMarkets}.name, ${guildMarkets}.description,
	${guildMarkets}.filepath, ${guildMarkets}.price`))
		.from(tableName)
		.where(`${tableName}.guild_id`, params.guild_id)
		.innerJoin(guildMarkets, `${tableName}.item_id`, `${guildMarkets}.id`);

	if (params.id) {
		query = query.where(`${tableName}.item_id`, params.id);
	}
	if (params.ids) {
		query = query.whereIn(`${tableName}.item_id`, params.ids);
	}

	return query;
};

export const getAll = async (params: Omit<GuildItemParams, "id">, pagination: PaginationProps = {
	limit: 10,
	offset: 0
}): Promise<GuildItemResponseProps[]> => {
	const queryParams = clone(params);
	const ids = queryParams.ids;
	delete queryParams.ids;
	const db = connection;
	let query = db.select(db.raw(`${tableName}.*, ${guildMarkets}.name, ${guildMarkets}.description, 
		${guildMarkets}.filepath, ${guildMarkets}.price,
		count(*) over() as total_count`))
		.from(tableName)
		.innerJoin(guildMarkets, `${tableName}.item_id`, `${guildMarkets}.id`)
		.where(queryParams)
		.limit(pagination.limit)
		.offset(pagination.offset);

	if (ids && ids.length > 0) {
		query = query.whereIn(`${tableName}.item_id`, ids);
	}

	return query;
};

export const create = async (data: GuildItemCreateProps) => {
	return await connection(tableName).insert(data);
};

export const update = async (params: { id: number }, data: { quantity: number }) => {
	return await connection(tableName).where(params).update(data);
};