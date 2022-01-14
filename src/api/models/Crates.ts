import { CrateParamProps, CrateProps } from "@customTypes/crates";
import { PaginationProps } from "@customTypes/pagination";
import connection from "db";

const tableName = "crates";

export const transformation = {
	id: {
		type: "number",
		autoIncrement: true,
	},
	category: {
		type: "string",
		isIn: [ "silver", "legendary", "premium" ],
	},
	userTag: {
		type: "string",
		columnName: "user_tag",
	},
	price: {
		type: "number",
		defaultsTo: 0,
	},
	contents: { type: "json", },
	isOnMarket: {
		type: "boolean",
		defaultsTo: false,
		columnName: "is_on_market",
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

export const getAll = async (params: CrateParamProps, pagination: PaginationProps): Promise<CrateProps[]> => {
	const db = connection;
	const alias = "cratealias";
	let query = db.select("*")
		.from(tableName)
		.where({ user_tag: params.user_tag })
		.as(alias);

	if (params.category) {
		query = query.where(`${tableName}.category`, params.category);
	}

	query = db.select(db.raw(`${alias}.*, count(*) over() as total_count`))
		.from(query);

	query = query.limit(pagination.limit).offset(pagination.offset);

	return query;
};

export const get = async (params: { user_tag: string; id: number; }): Promise<CrateProps[]> => {
	return await connection(tableName).where(params);
};

export const del = async (params: { id: number }) => {
	return await connection(tableName).where(params).del();
};