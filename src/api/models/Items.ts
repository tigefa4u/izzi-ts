import { FilterProps } from "@customTypes";
import { ItemProps } from "@customTypes/items";
import { PaginationProps } from "@customTypes/pagination";
import connection from "db";

const tableName = "items";
export const transformation = {
	id: {
		type: "number",
		autoIncrement: true,
	},
	name: { type: "string" },
	description: { type: "string" },
	stats: { type: "json" },
	filepath: { type: "string" },
	category: { type: "json" },
	price: { type: "number" },
	createdAt: {
		type: "timestamp",
		columnName: "created_at",
	},
	updatedAt: {
		type: "timestamp",
		columnName: "updated_at",
	},
};

export const get: (
  pagination: PaginationProps,
  filter?: Pick<FilterProps, "name" | "ids">
) => Promise<ItemProps[]> = async (
	pagination = {
		limit: 10,
		offset: 0,
	},
	filter
) => {
	const db = connection;
	const alias = "itemalias";
	let query = db
		.select(
			db.raw(`${tableName}.id, ${tableName}.name, ${tableName}.description, ${tableName}.stats,
			${tableName}.filepath, ${tableName}.category, ${tableName}.price`)
		)
		.from(tableName)
		.as(alias);

	if (filter?.ids && filter.ids.length > 0) {
		query = query.whereIn(`${tableName}.id`, filter.ids);
	}
	if (typeof filter?.name === "string") {
		query = query.where(`${tableName}.name`, "ilike", `%${filter.name}%`);
	} else if (typeof filter?.name === "object") {
		query = query.where(`${tableName}.name`, "~", `^(${filter.name.join("|")}).*`);
	}

	query = db.select(db.raw(`${alias}.*, count(*) over() as total_count`))
		.from(query);

	query = query.limit(pagination.limit).offset(pagination.offset);

	return query;
};
