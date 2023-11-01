import {
	CreateDarkZoneInvProps,
	DarkZoneInventoryProps,
	DzInventoryParams,
} from "@customTypes/darkZone/inventory";
import { PaginationProps } from "@customTypes/pagination";
import { SortProps } from "@customTypes/sorting";
import { RawUpdateReturnType } from "@customTypes/utility";
import connection from "db";
import { safeParseQueryParams } from "helpers/transformation";
import { clone } from "utility";

const tableName = "dark_zone_collections";
const characters = "characters";
const transformation = {
	id: { type: "number" },
	userTag: {
		type: "string",
		columnName: "user_tag",
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
	rank: { type: "string" },
	exp: {
		type: "number",
		default: 1,
	},
	rExp: {
		type: "number",
		default: 15,
		columnName: "r_exp",
	},
	skinId: {
		type: "number",
		columnName: "skin_id",
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
	isOnMarket: {
		type: "boolean",
		columnName: "is_on_market",
	},
};

const collArr = [
	"id",
	"user_tag",
	"is_tradable",
	"is_favorite",
	"metadata",
	"rank_id",
	"rank",
	"skin_id",
	"exp",
	"r_exp",
	"character_id",
	"character_level",
	"stats",
	"is_on_market",
	"created_at",
];

export const getAll = async function (
	params: DzInventoryParams,
	pagination: PaginationProps = {
		limit: 10,
		offset: 0,
	},
	sort: SortProps = {
		sortBy: "id",
		sortOrder: "desc",
	}
): Promise<DarkZoneInventoryProps[]> {
	let queryParams = clone(params);
	const character_ids = queryParams.character_ids;
	delete queryParams.character_ids;
	const rankIds = queryParams.rank_ids;
	delete queryParams.rank_ids;
	const isFavorite = queryParams.is_favorite;
	delete queryParams.is_favorite;
	const isTradable = queryParams.is_tradable;
	delete queryParams.is_tradable;
	const isOnMarket = queryParams.is_on_market;
	delete queryParams.is_on_market;

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
				${tableName}.user_tag,
				${tableName}.rank,
				${tableName}.is_on_market,
				${tableName}.exp,
				${tableName}.r_exp,
				${tableName}.rank_id,
				${tableName}.is_favorite,
				${tableName}.skin_id,
				${tableName}.is_tradable,
				${tableName}.character_level,
				${tableName}.metadata,
				${tableName}.stats,
				count(1) over() as total_count,
				row_number() over(order by rank_id desc, id 
					asc)`
				// ${sort ? sort.sortOrder : "desc"}
			)
		)
		.from(tableName)
		.where(queryParams)
		.as(alias);

	query = db.select(db.raw(`${alias}.*`)).from(query);
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
	if (isTradable === true || isTradable === false) {
		query = query.where(`${alias}.isTradable`, isTradable);
	}
	if (isOnMarket === true || isOnMarket === false) {
		query = query.where(`${alias}.is_on_market`, isOnMarket);
	}
	query = query.limit(pagination.limit).offset(pagination.offset);
	return query;
};

export const update = async (
	params: { user_tag?: string; id?: number | number[]; },
	data: Partial<DarkZoneInventoryProps>
): Promise<DarkZoneInventoryProps[]> => {
	let query = connection(tableName)
		.where({ is_deleted: false, })
		.update(data)
		.returning(collArr);

	if (typeof params.id === "number") {
		query = query.where("id", params.id);
	} else if (typeof params.id === "object") {
		query = query.whereIn("id", params.id);
	}

	return query;
};

export const rawUpdate = async (
	params: { user_tag?: string; id?: number },
	data: RawUpdateReturnType<Partial<DarkZoneInventoryProps>>
): Promise<DarkZoneInventoryProps[]> => {
	return connection(tableName)
		.where({
			...params,
			is_deleted: false,
		})
		.update(data)
		.returning(collArr);
};

export const create = async (data: CreateDarkZoneInvProps) => {
	return connection(tableName).insert(data);
};

export const getById = async (params: {
	id: number | number[];
	user_tag?: string;
	is_on_market?: boolean;
}): Promise<DarkZoneInventoryProps[]> => {
	let query = connection
		.select(
			connection.raw(`${characters}.name, ${tableName}.id,
			${tableName}.character_id,
			${tableName}.user_tag,
			${tableName}.rank,
			${tableName}.is_on_market,
			${tableName}.exp,
			${tableName}.r_exp,
			${tableName}.rank_id,
			${tableName}.is_favorite,
			${tableName}.skin_id,
			${tableName}.is_tradable,
			${tableName}.character_level,
			${tableName}.metadata,
			${tableName}.stats`)
		)
		.leftJoin(characters, `${tableName}.character_id`, `${characters}.id`)
		.from(tableName);

	if (typeof params.id === "number") {
		query = query.where(`${tableName}.id`, params.id);
	} else if (typeof params.id === "object") {
		query = query.whereIn(`${tableName}.id`, params.id);
	}

	if (params.user_tag) {
		query = query.where({ user_tag: params.user_tag });
	}
	if (typeof params.is_on_market === "boolean") {
		query = query.where({ is_on_market: params.is_on_market });
	}

	return query;
};

export const getByRowNumber = async (params: {
  row_number: number;
  user_tag: string;
  exclude_ids?: number[];
  is_on_cooldown?: boolean;
  sort?: SortProps;
  is_on_market?: boolean;
  is_tradable?: boolean;
}): Promise<DarkZoneInventoryProps[]> => {
	const sort = params.sort || {
		sortBy: "id",
		sortOrder: "desc",
	};
	const db = connection;
	let query = db
		.select(collArr)
		.from(tableName)
		.where(`${tableName}.user_tag`, params.user_tag)
		.orderBy("rank_id", "desc")
		.orderBy("id", "asc")
		.offset(params.row_number - 1)
		.limit(1);

	if (params.exclude_ids) {
		query = query.whereNotIn(`${tableName}.id`, params.exclude_ids);
	}

	if (typeof params.is_on_market === "boolean") {
		query = query.where(`${tableName}.is_on_market`, params.is_on_market);
	}
	if (typeof params.is_tradable === "boolean") {
		query = query.where(`${tableName}.is_tradable`, params.is_tradable);
	}

	return query;
};

export const dbConnection = connection;
