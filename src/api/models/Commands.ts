import { CommandProps } from "@customTypes/command";
import connection from "db";

const tableName = "commands";
export const transformation = {
	id: {
		type: "number",
		autoIncrement: true,
	},
	name: {
		type: "string",
		required: true,
	},
	usage: { type: "string" },
	alias: { type: Array },
	type: { type: "string" },
	description: { type: "string" },
	createdAt: {
		type: "timestamp",
		columnName: "created_at",
	},
	updatedAt: {
		type: "timestamp",
		columnName: "updated_at",
	},
	isBeginner: {
		type: "boolean",
		columnName: "is_beginner"
	}
};

export const getAll: (params?: { is_beginner: boolean; }) => Promise<CommandProps[]> = async function (params) {
	let query = connection.select("id", "name", "usage", "alias", "type", "description", "is_beginner")
		.from(tableName)
		.where({ is_deleted: false });

	if (typeof params?.is_beginner === "boolean") {
		query = query.where({ is_beginner: params.is_beginner });
	}

	return query;

};
export const findOne: (key: string) => Promise<CommandProps> = async function (
	key
) {
	try {
		const result = await connection.select("id", "name", "usage", "alias", "type", "description", "is_beginner")
			.from(tableName)
			/**
			 * ?? - is used to escape the bindings correctly.
			 * Using ? is causing a bug where knex is not able to pass the bindings
			 */
			.whereRaw("alias::jsonb @> '??'", [ key ])
			.where({ is_deleted: false });
		return result[0];
	} catch (err) {
		console.log(err);
	}
};
