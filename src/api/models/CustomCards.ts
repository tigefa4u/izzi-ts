import { CustomCardProps } from "@customTypes/users/customCards";
import connection from "db";

const tableName = "custom_cards";

const attributes = {
	id: {
		type: "number",
		autoIncrements: true
	},
	userTag: {
		type: "string",
		columnName: "user_tag",
		ref: "users.user_tag"
	},
	info: { type: "jsonb" },
	cards: { type: "jsonb" },
	metadata: { type: "jsonb" },
	isDeleted: {
		type: "boolean",
		columnName: "is_deleted",
		defaultsTo: false
	}
};

export const getByUser = async (tag: string): Promise<CustomCardProps> => {
	return connection(tableName).where({ user_tag: tag }).then((res) => res[0]);
};