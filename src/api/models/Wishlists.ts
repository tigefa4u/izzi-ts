import { PaginationProps } from "@customTypes/pagination";
import {
	WishlistCreateProps, WishlistParamProps, WishlistProps, WishlistUpdateParamProps, WishlistUpdateProps 
} from "@customTypes/wishlist";
import connection from "db";
import loggers from "loggers";

const tableName = "wishlists";
const characters = "characters";

export const getAll = (
	params: WishlistParamProps & { name?: string | string[]; },
	pagination: PaginationProps
): Promise<WishlistProps[]> => {
	const db = connection;
	const name = params.name;
	delete params.name;
	let query = db
		.select(
			db.raw(
				`${tableName}.*, ${characters}.name, count(*) over() as total_count`
			)
		)
		.from(tableName)
		.leftJoin(characters, `${tableName}.character_id`, `${characters}.id`)
		.where(params);

	if (typeof name === "string") {
		query = query.where(`${characters}.name`, "ilike", `%${name}%`);
	} else if (typeof name === "object") {
		query = query.where(`${characters}.name`, "~*", `(${name.join("|")}).*`);
	}
	query = query.limit(pagination.limit).offset(pagination.offset);
	return query;
};

export const create = (data: WishlistCreateProps) => {
	return connection(tableName).insert(data);
};

export const update = async (params: WishlistUpdateParamProps, data: WishlistUpdateProps) => {
	return connection(tableName).where(params).update(data);
};

export const del = async (params: WishlistUpdateParamProps) => {
	return connection(tableName).where(params).del();
};

export const get = async (params: any) => {
	return connection(tableName).where(params);
};

export const getRandom = async (params: any) => {
	loggers.info("Models.Wishlist.getRandom: fetching with params", { params });
	return connection(tableName).where({
		...params,
		is_random: true,
		is_skin: false
	}).orderByRaw("random()").limit(1);
};