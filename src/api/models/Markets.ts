import { PaginationProps } from "@customTypes/pagination";
import connection from "db";

const tableName = "markets";
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

export const getAll = async (params: { collection_ids: number[] }, pagination: PaginationProps = {
	limit: 10,
	offset: 0
}) => {
	const db = connection;
	const query = db
		.select(db.raw(`${tableName}.*, count(*) over() as total_count`))
		.whereIn(`${tableName}.collection_ids`, params.collection_ids)
		.limit(pagination.limit)
		.offset(pagination.offset);

	return query;
};