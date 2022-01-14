import { MarriageCreateProps, MarriageProps } from "@customTypes/marriages";
import connection from "db";

const tableName = "marriages";
export const transformation = {
	id: {
		type: "number",
		autoIncrement: true,
	},
	userTag: {
		type: "string",
		columnName: "user_tag",
	},
	marriedTo: {
		type: "string",
		columnName: "married_to",
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

export const get = async (params: {
  user_tag: string;
}): Promise<MarriageProps[]> => {
	return await connection(tableName).where(params);
};

export const del = async (params: { user_tag: string }) => {
	return await connection(tableName)
		.where(params)
		.orWhere({ married_to: params.user_tag })
		.del();
};

export const create = async (data: MarriageCreateProps) => {
	return await connection(tableName).insert(data);
};