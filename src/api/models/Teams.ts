import { TeamCreateProps, TeamProps, TeamUpdateData, TeamUpdateParams } from "@customTypes/teams";
import connection from "db";

const tableName = "teams";
export const transformation = {
	id: {
		type: "integer",
		autoIncrements: true,
	},
	userId: {
		type: "integer",
		columnName: "user_id",
		ref: "users"
	},
	name: { type: "string", },
	metadata: { type: "json", },
	createdAt: {
		type: "timestamp",
		columnName: "created_at",
	},
	updatedAt: {
		type: "timestamp",
		columnName: "updated_at",
	},
};

export const get = async (params: Partial<TeamUpdateParams>): Promise<TeamProps[]> => {
	return connection(tableName).where(params);
};

export const update = async (params: TeamUpdateParams, data: Partial<TeamUpdateData>) => {
	return connection(tableName).where(params).update(data);
};

export const create = async (data: TeamCreateProps) => {
	return connection(tableName).insert(data);
};

export const del = async (params: TeamUpdateParams) => {
	return connection(tableName).where(params).del();
};