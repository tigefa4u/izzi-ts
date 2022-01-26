import { BanProps } from "@customTypes/bans";
import connection from "db";

const tableName = "bans";
export const transformation =  {
	id: {
		type: "number",
		autoIncrements: true
	},
	userTag: {
		type: "string",
		columnName: "user_tag"
	},
	banReason: {
		type: "string",
		columnName: "ban_reason"
	},
	banLength: {
		type: "number",
		columnName: "ban_length"
	}
};

export const get = async (params: { user_tag: string }): Promise<BanProps[]> => {
	return await connection(tableName).where(params);
};