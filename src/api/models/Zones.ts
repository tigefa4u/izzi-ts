import { PaginationProps } from "@customTypes/pagination";
import { ZoneProps } from "@customTypes/zones";
import connection from "db";

const tableName = "ruins";
export const transformation = {
	id: {
		type: "number",
		autoIncrement: true,
	},
	locationId: {
		type: "number",
		default: 1,
		columnName: "location_id",
	},
	maxFloor: {
		type: "number",
		required: true,
		columnName: "max_floor",
	},
	filepath: { type: "string", },
	series: { type: "string", },
	name: { type: "string", },
	description: { type: "string", },
	createdAt: {
		type: "timestamp",
		columnName: "created_at",
	},
	updatedAt: {
		type: "timestamp",
		columnName: "updated_at",
	},
};

export const get = async (params: { location_id: number }): Promise<ZoneProps> => {
	const db = connection;
	const query = db
		.select("*")
		.from(tableName)
		.where(`${tableName}.location_id`, params.location_id)
		.then((res) => res[0]);

	return query;
};

export const getAll = async (pagination: PaginationProps = {
	limit: 10,
	offset: 0
}): Promise<ZoneProps[]> => {
	const db = connection;
	let query = db
		.select(db.raw(`${tableName}.*, count(*) over() as total_count`))
		.from(tableName)
		.orderBy(`${tableName}.location_id`, "asc");

	query = query.limit(pagination.limit).offset(pagination.offset);

	return query;
};