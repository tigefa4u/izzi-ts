import {
	CollectionParams,
	CollectionProps,
	CollectionUpdateProps,
	ICollectionCreateProps,
} from "@customTypes/collections";
import { PaginationProps } from "@customTypes/pagination";
import connection from "db";
import { safeParseQueryParams } from "helpers/transformation";
import { clone } from "utility";

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

export const get = async (
	params: CollectionParams
): Promise<CollectionProps[]> => {
	let queryParams = clone(params);
	const character_ids = queryParams.character_ids;
	delete queryParams.character_ids;
	const ids = queryParams.ids;
	delete queryParams.ids;

	queryParams = safeParseQueryParams({
		query: queryParams,
		attributes: transformation
	});

	const db = connection;
	let query = db.select("*").from(tableName).where(queryParams);
	
	if (ids) {
		query = query.whereIn("id", ids);
	}
	if (character_ids) {
		query = query.whereIn("character_id", character_ids);
	}
	if (typeof queryParams.rank === "string") {
		query = query.where(`${tableName}.rank`, queryParams.rank);
	} else if (typeof queryParams.rank === "object") {
		query = query.where(
			`${tableName}.rank`,
			"~",
			`^(${queryParams.rank.join("|")}).*`
		);
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
	let queryParams = clone(params);
	const character_ids = queryParams.character_ids;
	delete queryParams.character_ids;
	const rankIds = queryParams.rank_ids;
	delete queryParams.rank_ids;
	const isFavorite = queryParams.is_favorite;
	delete queryParams.is_favorite;
	const isOnMarket = queryParams.is_on_market;
	delete queryParams.is_on_market;

	queryParams = safeParseQueryParams({
		query: queryParams,
		attributes: transformation
	});

	const db = connection;
	const alias = "collectionalias";
	let query = db
		.select(
			db.raw(
				`${tableName}.*, row_number() over(order by rank_id desc, id desc)`
			)
		)
		.from(tableName)
		.where(queryParams)
		.as(alias);

	query = db
		.select(db.raw(`${alias}.*, count(*) over() as total_count`))
		.from(query)
		.orderBy(`${alias}.rank_id`, "desc");

	if (character_ids) {
		query = query.whereIn(`${alias}.character_id`, character_ids);
	}
	if (typeof rankIds === "number") {
		query = query.where(`${alias}.rank_id`, rankIds);
	} else if (typeof rankIds === "object") {
		query = query.whereIn(`${alias}.rank_id`, rankIds);
	}
	if (isFavorite === true || isFavorite === false) {
		query = query.where(`${alias}.is_favorite`, isFavorite);
	}
	if (isOnMarket || isOnMarket) {
		query = query.where(`${alias}.is_on_market`, isOnMarket);
	}
	query = query.limit(pagination.limit).offset(pagination.offset);
	return query;
};

export const create: (
  data: ICollectionCreateProps
) => Promise<CollectionProps> = async (data) => {
	const db = connection;
	return await db(tableName)
		.insert(data, "*")
		.then((res) => res[0]);
};

export const update = async (
	params: Pick<CollectionParams, "id" | "ids">,
	data: CollectionUpdateProps
) => {
	if (!params.id && !params.ids) return;
	const db = connection;
	let query = db(tableName);

	if (params.id) {
		query = query.where(params);
	} else if (params.ids) {
		query = query.whereIn(`${tableName}.id`, params.ids);
	}
	return query.update(data);
};

export const getByRowNumber = async (params: {
  row_number: number | number[];
  user_id: number;
}): Promise<CollectionProps[]> => {
	const db = connection;
	const alias = "collectionalias";
	let query = db
		.select(db.raw(`${tableName}.*, row_number() over(order by rank_id desc, id desc)`))
		.from(tableName)
		.where(`${tableName}.user_id`, params.user_id)
		.as(alias);
	
	query = db.select(db.raw(`${alias}.*`))
		.from(query);

	if (typeof params.row_number === "number") {
		query = query
			.where(`${alias}.row_number`, params.row_number);
	} else if (typeof params.row_number === "object") {
		query = query
			.whereIn(`${alias}.row_number`, params.row_number);
	}

	return query;
};

export const destroy = async (params: Pick<CollectionParams, "id" | "ids">) => {
	if (!params.id && !params.ids) return;
	const db = connection;
	let query = db(tableName);

	if (params.id) {
		query = query.where(params);
	} else if (params.ids) {
		query = query.whereIn(`${tableName}.id`, params.ids);
	}

	return await query.del();
};