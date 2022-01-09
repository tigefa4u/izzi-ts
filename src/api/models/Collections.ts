import {
	CollectionParams,
	CollectionProps,
	ICollectionCreateProps,
} from "@customTypes/collections";
import { PaginationProps } from "@customTypes/pagination";
import connection from "db";

const tableName = "collections";
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
	characterId: {
		type: "number",
		ref: "characters",
		columnName: "character_id",
	},
	characterLevel: {
		type: "number",
		default: 1,
		columnName: "character_level",
	},
	rank: {
		type: "string",
		default: "silver",
	},
	isOnMarket: {
		type: "boolean",
		default: false,
		columnName: "is_on_market",
	},
	isItem: {
		type: "boolean",
		default: false,
		columnName: "is_item",
	},
	itemId: {
		type: "number",
		columnName: "item_id",
	},
	exp: {
		type: "number",
		default: 1,
	},
	rExp: {
		type: "number",
		default: 15,
		columnName: "r_exp",
	},
	souls: {
		type: "number",
		default: 1,
	},
	rankId: {
		type: "number",
		columnName: "rank_id",
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

export const get = async (params: CollectionParams): Promise<CollectionProps[]> => {
	const character_ids = params.character_ids;
	delete params.character_ids;
	const db = connection;
	let query = db.select("*").from(tableName).where(params);

	if (character_ids) {
		query = query.whereIn("character_id", character_ids);
	}
	if (typeof params.rank === "string") {
		query = query.where(`${tableName}.rank`, params.rank);
	} else if (typeof params.rank === "object") {
		query = query.where(`${tableName}.rank`, "~", `^(${params.rank.join("|")}).*`);
	}

	return query;	
};

export const getAll = async function (
	params: CollectionParams,
	pagination: PaginationProps = {
		limit: 10,
		offset: 0,
	}
): Promise<CollectionProps[]> {
	const character_ids = params.character_ids;
	delete params.character_ids;
	const db = connection;
	let query = db.select("*").from(tableName).where(params);

	if (character_ids) {
		query = query.whereIn("character_id", character_ids);
	}

	query = query.limit(pagination.limit).offset(pagination.offset);
	return query;
};

export const create: (
	data: ICollectionCreateProps
) => Promise<CollectionProps> = async (data) => {
	console.log({ data });
	const db = connection;
	return await db(tableName)
		.insert(data, "*")
		.then((res) => res[0]);
};
