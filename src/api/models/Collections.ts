import {
	CollectionParams,
	CollectionProps,
	CollectionUpdateProps,
	ICollectionCreateProps,
} from "@customTypes/collections";
import { PaginationProps } from "@customTypes/pagination";
import { SortProps } from "@customTypes/sorting";
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
	isOnCooldown: {
		type: "boolean",
		default: false,
		columnName: "is_on_cooldown",
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
	isFavorite: {
		type: "boolean",
		columnName: "is_favorite"
	},
	createdAt: {
		type: "timestamp",
		columnName: "created_at",
	},
	updatedAt: {
		type: "timestamp",
		columnName: "updated_at",
	},
	isTradable: {
		type: "boolean",
		columnName: "is_tradable"
	}
};

export const get = async (
	params: CollectionParams & { limit?: number }
): Promise<CollectionProps[]> => {
	let queryParams = clone(params);
	const character_ids = queryParams.character_ids;
	delete queryParams.character_ids;
	const ids = queryParams.ids;
	delete queryParams.ids;
	const exclude_ids = queryParams.exclude_ids;
	delete queryParams.exclude_ids;
	const exclude_character_ids = queryParams.exclude_character_ids;
	delete queryParams.exclude_character_ids;
	const rank = queryParams.rank;
	delete queryParams.rank;
	const limit = queryParams.limit;
	delete queryParams.limit;

	queryParams = safeParseQueryParams({
		query: queryParams,
		attributes: transformation
	});

	const db = connection;
	let query = db.select("*").from(tableName).where(queryParams);
	
	if (ids) {
		query = query.whereIn("id", ids);
	}
	if (character_ids && character_ids.length > 0) {
		query = query.whereIn("character_id", character_ids);
	}
	if (exclude_ids && exclude_ids.length > 0) {
		query = query.whereNotIn("id", exclude_ids);
	}
	if (exclude_character_ids && exclude_character_ids.length > 0) {
		query = query.whereNotIn("character_id", exclude_character_ids);
	}
	if (typeof rank === "string") {
		query = query.where(`${tableName}.rank`, rank);
	} else if (typeof rank === "object") {
		query = query.where(
			`${tableName}.rank`,
			"~*",
			`(${rank.join("|")}).*`
		);
	}
	if (typeof queryParams.is_on_market === "boolean") {
		query = query.where(`${tableName}.is_on_market`, queryParams.is_on_market);
	}
	if (typeof queryParams.is_tradable === "boolean") {
		query = query.where(`${tableName}.is_tradable`, queryParams.is_tradable);
	}
	if (limit) {
		query = query.limit(limit);
	}

	return query;
};

export const getAll = async function (
	params: CollectionParams,
	pagination: PaginationProps = {
		limit: 10,
		offset: 0,
	},
	sort: SortProps = {
		sortBy: "id",
		sortOrder: "desc"
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
	const isTradable = queryParams.is_tradable;
	delete queryParams.is_tradable;
	const isOnCooldown = queryParams.is_on_cooldown;
	delete queryParams.is_on_cooldown;

	queryParams = safeParseQueryParams({
		query: queryParams,
		attributes: transformation
	});

	const db = connection;
	const alias = "collectionalias";
	let query = db
		.select(
			db.raw(
				`${tableName}.*, row_number() over(order by rank_id desc, id 
					asc)`
				// ${sort ? sort.sortOrder : "desc"}
			)
		)
		.from(tableName)
		.where(queryParams)
		.as(alias);

	query = db
		.select(db.raw(`${alias}.*, count(*) over() as total_count`))
		.from(query);
	// .orderBy(`${alias}.rank_id`, "desc");

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
	if (isOnMarket === true || isOnMarket === false) {
		query = query.where(`${alias}.is_on_market`, isOnMarket);
	}
	if (isOnCooldown === true || isOnCooldown === false) {
		query = query.where(`${alias}.is_on_cooldown`, isOnCooldown);
	}
	if (isTradable === true || isTradable === false) {
		query = query.where(`${alias}.isTradable`, isOnMarket);
	}
	query = query.limit(pagination.limit).offset(pagination.offset);
	return query;
};

export const create: (
  data: ICollectionCreateProps
) => Promise<CollectionProps> = async (data) => {
	const db = connection;
	if (!data || Array.isArray(data) && data.length <= 0) return;
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
  exclude_ids?: number[];
  is_on_cooldown?: boolean;
  sort?: SortProps;
  is_on_market?: boolean;
  is_tradable?: boolean;
}): Promise<CollectionProps[]> => {
	const sort = params.sort || {
		sortBy: "id",
		sortOrder: "desc"
	};
	const db = connection;
	const alias = "collectionalias";
	let query = db
		.select(db.raw(`${tableName}.*, row_number() over(order by rank_id desc, 
			id asc)`))
	// ${sort ? sort.sortOrder : "desc"}
		.from(tableName)
		.where(`${tableName}.user_id`, params.user_id)
		.as(alias);
	
	if (params.exclude_ids) {
		query = query.whereNotIn(`${tableName}.id`, params.exclude_ids);
	}
	
	query = db.select(db.raw(`${alias}.*`))
		.from(query);

	if (typeof params.row_number === "number") {
		query = query
			.where(`${alias}.row_number`, params.row_number);
	} else if (typeof params.row_number === "object") {
		query = query
			.whereIn(`${alias}.row_number`, params.row_number);
	}
	if (typeof params.is_on_cooldown === "boolean") {
		query = query.where(`${alias}.is_on_cooldown`, params.is_on_cooldown);
	}
	if (typeof params.is_on_market === "boolean") {
		query = query.where(`${alias}.is_on_market`, params.is_on_market);
	}
	if (typeof params.is_tradable === "boolean") {
		query = query.where(`${alias}.is_tradable`, params.is_tradable);
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

export const verifyIds = async (params: { user_id: number; ids: number[] }) => {
	if (!params.user_id) return;
	const db = connection;
	const query = db.select("id")
		.from(tableName)
		.where(`${tableName}.user_id`, params.user_id)
		.whereIn(`${tableName}.id`, params.ids);

	return query;
};

export const resetAllNicknames = (user_id: number) => {
	const db = connection;
	const query = db(tableName).where({ user_id }).update({ metadata: {} });
	return query;
};