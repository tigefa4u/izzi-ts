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
		required: true
	},
	usage: { type: "string" },
	alias: { type: Array, },
	type: { type: "string", },
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

export const getAll: () => Promise<CommandProps[]> = async function() {
	return await connection(tableName);
};
export const getCommand: (key: string) => Promise<CommandProps> = async function(key) {
	const result = await connection.raw(`select * from ${tableName} where alias::jsonb @> '"${key}"'`)
		.then((res) => res.rows);
 
	return result[0];
};