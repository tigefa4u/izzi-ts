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
};

export const getAll: () => Promise<CommandProps[]> = async function () {
	return connection(tableName).where({ is_deleted: false });
};
export const findOne: (key: string) => Promise<CommandProps> = async function (
	key
) {
	try {
		const result = await connection.select("id", "name", "usage", "alias", "type", "description")
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
