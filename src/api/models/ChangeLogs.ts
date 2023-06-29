import { ChangeLogProps } from "@customTypes/changelogs";
import connection from "db";

const tableName = "change_logs";

export const transformation = {
	id: {
		type: "integer",
		autoIncrements: true 
	},
	name: { type: "string" },
	description: { type: "string" },
	metadata: { type: "json", },
	createdAt: {
		type: "timestamp",
		columnName: "created_at",
	},
	updatedAt: {
		type: "timestamp",
		columnName: "updated_at",
	},
	isDeleted: {
		type: "boolean",
		columnName: "is_deleted"
	}
};

export const get = async (): Promise<ChangeLogProps[]> => connection(tableName)
	.where({ is_deleted: false }).limit(2);
