import { FilterProps } from "@customTypes";
import { AbilityProps } from "@customTypes/abilities";
import { PaginationProps } from "@customTypes/pagination";
import connection from "db";

const tableName = "passives";

export const transformation = {
	id: {
		type: "number",
		autoIncrement: true,
	},
	name: { type: "string" },
	description: { type: "string" },
	uuid: { type: "number" },
	createdAt: {
		type: "timestamp",
		columnName: "created_at",
	},
	updatedAt: {
		type: "timestamp",
		columnName: "updated_at",
	},
	// to monitor what abilities are being used the most.
	usage: { type: "number" },
};

export const get = async (
	pagination: PaginationProps,
	filter?: Pick<FilterProps, "name">
): Promise<AbilityProps[]> => {
	const db = connection;
	const alias = "abilityalias";
	let query = db.select("*").from(tableName).where({ is_deleted: false }).as(alias);

	if (typeof filter?.name === "string") {
		query = query.where(`${tableName}.name`, "ilike", `%${filter.name}%`);
	} else if (typeof filter?.name === "object") {
		query = query.where(`${tableName}.name`, "~*", `(${filter.name.join("|")}).*`);
	}

	query = db
		.select(db.raw(`${alias}.*, count(*) over() as total_count`))
		.from(query);

	query = query.limit(pagination.limit).offset(pagination.offset);

	return query;
};

export const logUsage = async (names: string[]) => {
	return connection(tableName).whereIn("name", names).update({ usage: connection.raw("usage + 1") });
};