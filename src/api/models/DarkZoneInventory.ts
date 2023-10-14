import { CreateDarkZoneInvProps, DarkZoneInventoryProps, DzInventoryParams } from "@customTypes/darkZone/inventory";
import { PaginationProps } from "@customTypes/pagination";
import { SortProps } from "@customTypes/sorting";
import { RawUpdateReturnType } from "@customTypes/utility";
import connection from "db";
import { safeParseQueryParams } from "helpers/transformation";
import { clone } from "utility";

const tableName = "dark_zone_collections";
const transformation = {
	id: { type: "number" },
	userTag: {
		type: "string",
		columnName: "user_tag"
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
	"created_at"
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
				row_number() over(order by rank_id desc, id 
					asc)`
				// ${sort ? sort.sortOrder : "desc"}
			)
		)
		.from(tableName)
		.where(queryParams)
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
	user_tag: string,
	data: Partial<DarkZoneInventoryProps>
): Promise<DarkZoneInventoryProps[]> =>
	connection(tableName)
		.where({
			user_tag,
			is_deleted: false,
		})
		.update(data)
		.returning(collArr);

export const rawUpdate = async (
	user_tag: string,
	data: RawUpdateReturnType<Partial<DarkZoneInventoryProps>>
): Promise<DarkZoneInventoryProps[]> => {
	return connection(tableName)
		.where({
			user_tag,
			is_deleted: false,
		})
		.update(data)
		.returning(collArr);
};

export const create = async (data: CreateDarkZoneInvProps) => {
	return connection(tableName).insert(data);
};

export const getById = async (id: number | number[], user_tag?: string): Promise<DarkZoneInventoryProps[]> => {
	let query = connection.select(collArr).from(tableName);

	if (typeof id === "number") {
		query = query.where("id", id);
	} else if (typeof id === "object") {
		query = query.whereIn("id", id);
	}

	if (user_tag) {
		query = query.where({ user_tag });
	}

	return query;
};

export const dbConnection = connection;