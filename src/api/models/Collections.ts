import {
	CollectionParams,
	CollectionProps,
	CollectionUpdateProps,
	ICollectionCreateProps,
	ICollectionItemCreateProps,
} from "@customTypes/collections";
import { PaginationProps } from "@customTypes/pagination";
import { SortProps } from "@customTypes/sorting";
import connection from "db";
import { safeParseQueryParams } from "helpers/transformation";
import { clone } from "utility";

export const tableName = "collections";
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
		columnName: "is_favorite",
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
		columnName: "is_tradable",
	},
	cardCount: {
		type: "number",
		columnName: "card_count"
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
		attributes: transformation,
	});

	const db = connection;
	let query = db
		.select(
			"id",
			"character_id",
			"user_id",
			"rank",
			"is_on_market",
			"is_item",
			"exp",
			"r_exp",
			"souls",
			"item_id",
			"character_id",
			"rank_id",
			"is_favorite",
			"skin_id",
			"is_on_cooldown",
			"character_level",
			"is_tradable",
			"metadata",
			"card_count"
		)
		.from(tableName)
		.where(queryParams)
		.where("card_count", ">", 0);

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
		query = query.where(`${tableName}.rank`, "~*", `(${rank.join("|")}).*`);
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

export const getCountForGetAll = async (params: CollectionParams) => {
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
		attributes: transformation,
	});

	const db = connection;
	let query = db.select(db.raw("count(1) as total_count"))
		.from(tableName)
		.where(queryParams)
		.where("card_count", ">", 0);
	if (character_ids) {
		query = query.whereIn(`${tableName}.character_id`, character_ids);
	}
	if (typeof rankIds === "number") {
		query = query.where(`${tableName}.rank_id`, rankIds);
	} else if (typeof rankIds === "object") {
		query = query.whereIn(`${tableName}.rank_id`, rankIds);
	}
	if (isFavorite === true || isFavorite === false) {
		query = query.where(`${tableName}.is_favorite`, isFavorite);
	}
	if (isOnMarket === true || isOnMarket === false) {
		query = query.where(`${tableName}.is_on_market`, isOnMarket);
	}
	if (isOnCooldown === true || isOnCooldown === false) {
		query = query.where(`${tableName}.is_on_cooldown`, isOnCooldown);
	}
	if (isTradable === true || isTradable === false) {
		query = query.where(`${tableName}.isTradable`, isOnMarket);
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
		sortOrder: "desc",
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
		attributes: transformation,
	});

	const db = connection;
	const alias = "collectionalias";
	let query = db
		.select(
			db.raw(
				`${tableName}.id,
				${tableName}.character_id,
				${tableName}.user_id,
				${tableName}.rank,
				${tableName}.is_on_market,
				${tableName}.is_item,
				${tableName}.exp,
				${tableName}.r_exp,
				${tableName}.souls,
				${tableName}.item_id,
				${tableName}.rank_id,
				${tableName}.is_favorite,
				${tableName}.skin_id,
				${tableName}.is_on_cooldown, 
				${tableName}.is_tradable,
				${tableName}.character_level,
				${tableName}.metadata,
				${tableName}.card_count,
				row_number() over(order by rank_id desc, id 
					asc)`
				// ${sort ? sort.sortOrder : "desc"}
			)
		)
		.from(tableName)
		.where(queryParams)
		.where("card_count", ">", 0)
		.as(alias);

	query = db
		.select(db.raw(`${alias}.*`))
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
		query = query.where(`${alias}.isTradable`, isTradable);
	}
	query = query.limit(pagination.limit).offset(pagination.offset);
	return query;
};

export const getFoddersForEnchantmentV2 = async (params: CollectionParams, filter: {
	cond?: "gte" | "lte";
	limit: number;
}): Promise<{
	id: number;
	character_id: number;
	user_id: number;
	card_count: number;
}[]> => {
	const ids = params.ids;
	const character_ids = params.character_ids;
	const exclude_ids = params.exclude_ids;
	const exclude_character_ids = params.exclude_character_ids;
	const db = connection;
	let query = db.select("id", "character_id", "user_id", "card_count")
		.from(tableName)
		.where("rank", "platinum")
		.where("user_id", params.user_id)
		.orderBy("card_count", "desc")
		.where("card_count", ">", 0);

	if (ids && ids.length > 0) {
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
	
	query = query.limit(filter.limit || 1);

	return query;
};

export const create: (
  data: ICollectionCreateProps | ICollectionItemCreateProps
) => Promise<CollectionProps> = async (data) => {
	const db = connection;
	if (!data || (Array.isArray(data) && data.length <= 0)) return;
	return db(tableName)
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
  row_number: number;
  user_id: number;
  exclude_ids?: number[];
  is_on_cooldown?: boolean;
  sort?: SortProps;
  is_on_market?: boolean;
  is_tradable?: boolean;
}): Promise<CollectionProps[]> => {
	const sort = params.sort || {
		sortBy: "id",
		sortOrder: "desc",
	};
	const db = connection;
	let query = db
		.select("*")
		.from(tableName)
		.where(`${tableName}.user_id`, params.user_id)
		.andWhereRaw(`not ${tableName}.is_item`)
		.orderBy("rank_id", "desc")
		.orderBy("id", "asc")
		.where("card_count", ">", 0)
		.offset(params.row_number - 1) // Need to subtract 1, to choose correct row
		.limit(1);

	if (params.exclude_ids) {
		query = query.whereNotIn(`${tableName}.id`, params.exclude_ids);
	}

	if (typeof params.is_on_cooldown === "boolean") {
		query = query.where(`${tableName}.is_on_cooldown`, params.is_on_cooldown);
	}
	if (typeof params.is_on_market === "boolean") {
		query = query.where(`${tableName}.is_on_market`, params.is_on_market);
	}
	if (typeof params.is_tradable === "boolean") {
		query = query.where(`${tableName}.is_tradable`, params.is_tradable);
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

	return query.del();
};

export const verifyIds = async (params: { user_id: number; ids: number[] }): Promise<{
	id: number;
	card_count: number;
}[]> => {
	const db = connection;
	const query = db
		.select("id", "card_count")
		.from(tableName)
		.where(`${tableName}.user_id`, params.user_id)
		.where("card_count", ">", 0)
		.whereIn(`${tableName}.id`, params.ids);

	return query;
};

export const resetAllNicknames = (user_id: number) => {
	const db = connection;
	const query = db(tableName).where({ user_id }).update({ metadata: {} });
	return query;
};

export const getFodderCount = async (user_id: number): Promise<{ sum: number; }[]> => {
	return connection(tableName).where({
		user_id,
		rank: "platinum" 
	}).where("card_count", ">", 0).sum("card_count");
};

export const dbConnection = connection;

export const groupByCharacterId = async (user_id: number, character_ids: number[]) => {
	const db = connection;
	return db.select("id", "character_id", "user_id")
		.from(tableName)
		.whereIn("character_id", character_ids)
		.groupBy([ "character_id", "id" ])
		.where({ user_id })
		.where("card_count", ">", 0)
		.limit(character_ids.length);
};