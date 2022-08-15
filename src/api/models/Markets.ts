import { FilterProps } from "@customTypes";
import { IMarketProps, MarketCreateProps } from "@customTypes/market";
import { PaginationProps } from "@customTypes/pagination";
import connection from "db";

const tableName = "markets";
const collections = "collections";
const characters = "characters";
const abilities = "passives";
const cards = "cards";
export const transformation = {
	id: {
		type: "number",
		autoIncrement: true,
	},
	userId: {
		type: "number",
		required: true,
		columnName: "user_id",
		ref: "users",
	},
	price: {
		type: "number",
		default: 1000,
	},
	collectionId: {
		type: "number",
		required: true,
		columnName: "collection_id",
	},
	createdAt: {
		type: "timestamp",
		columnName: "created_at",
	},
	updatedAt: {
		type: "timestamp",
		columnName: "updated_at",
	},
};

export const getAll = async (
	params: Pick<FilterProps, "name" | "rank" | "abilityname" | "type">,
	pagination: PaginationProps = {
		limit: 10,
		offset: 0,
	}
): Promise<IMarketProps[]> => {
	const db = connection;
	const alias = "marketalias";
	let query = db
		.select(
			db.raw(`${tableName}.*, ${collections}.rank, ${characters}.name, ${abilities}.name as abilityname,
			${collections}.souls, ${characters}.type, ${collections}.character_level`)
		)
		.from(tableName)
		.innerJoin(collections, `${tableName}.collection_id`, `${collections}.id`)
		.innerJoin(characters, `${collections}.character_id`, `${characters}.id`)
		.innerJoin(abilities, `${characters}.passive_id`, `${abilities}.id`)
		.as(alias);

	if (typeof params.name === "string") {
		query = query.where(`${characters}.name`, "ilike", `%${params.name}%`);
	} else if (typeof params.name === "object") {
		query = query.where(
			`${characters}.name`,
			"~*",
			`(${params.name.join("|")}).*`
		);
	}
	if (typeof params.type === "string") {
		query = query.where(`${tableName}.type`, "ilike", `%${params.type}%`);
	} else if (typeof params.type === "object") {
		query = query.where(
			`${tableName}.type`,
			"~*",
			`(${params.type.join("|")}).*`
		);
	}
	if (typeof params.abilityname === "string") {
		query = query.where(
			`${abilities}.name`,
			"ilike",
			`%${params.abilityname}%`
		);
	} else if (typeof params.abilityname === "object") {
		query = query.where(
			`${abilities}.name`,
			"~*",
			`(${params.abilityname.join("|")}).*`
		);
	}
	if (typeof params.rank === "string") {
		query = query.where(`${collections}.rank`, "ilike", `%${params.rank}%`);
	} else if (typeof params.rank === "object") {
		query = query.where(
			`${collections}.rank`,
			"~*",
			`(${params.rank.join("|")}).*`
		);
	}

	query = db
		.select(db.raw(`${alias}.*, count(*) over() as total_count`))
		.from(query)
		.orderBy(`${alias}.price`, "asc");

	query = query.limit(pagination.limit).offset(pagination.offset);

	return query;
};

export const getMarketCollection = async (params: {
	is_on_market: boolean;
	collection_id: number;
}): Promise<IMarketProps> => {
	const db = connection;
	const query = db
		.select(
			db.raw(`${tableName}.*, ${collections}.rank, ${characters}.name, ${abilities}.name as abilityname,
			${collections}.souls, ${characters}.type, ${collections}.character_level,
			${cards}.filepath, ${cards}.metadata`)
		)
		.from(tableName)
		.innerJoin(collections, `${tableName}.collection_id`, `${collections}.id`)
		.innerJoin(characters, `${collections}.character_id`, `${characters}.id`)
		.innerJoin(abilities, `${characters}.passive_id`, `${abilities}.id`)
		.innerJoin(cards, `${characters}.id`, `${cards}.character_id`)
		.where(`${collections}.is_on_market`, params.is_on_market)
		.where(`${tableName}.collection_id`, params.collection_id)
		.then((res) => res[0]);

	return query;
};

export const del = async (params: { id?: number; collection_ids?: number | number[] }) => {
	if (!params.id && !params.collection_ids) return;
	const db = connection;
	let query = db(tableName);

	if (params.id) {
		query = query.where(params);
	} else if (params.collection_ids) {
		if (typeof params.collection_ids === "number") {
			query = query.where(`${tableName}.id`, params.collection_ids);
		} else if (typeof params.collection_ids === "object") {
			query = query.whereIn(`${tableName}.collection_id`, params.collection_ids);
		}
	}

	return await query.del();
};

export const create = async (data: MarketCreateProps) => {
	return await connection(tableName).insert(data);
};