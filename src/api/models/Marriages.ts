import { MarriageCreateProps, MarriageProps } from "@customTypes/marriages";
import connection from "db";

const tableName = "marriages";
const users = "users";
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
	const db = connection;
	return db.select(db.raw(`${tableName}.*, ${users}.username as married_to_username`))
		.from(tableName)
		.innerJoin(users, `${tableName}.married_to`, `${users}.user_tag`)
		.where(`${tableName}.user_tag`, params.user_tag);
};

export const del = async (params: { user_tag: string }) => {
	return connection(tableName)
		.where(params)
		.orWhere({ married_to: params.user_tag })
		.del();
};

export const create = async (data: MarriageCreateProps) => {
	return connection(tableName).insert(data);
};