import { UserRankProps } from "@customTypes/userRanks";
import connection from "db";

const tableName = "user_ranks";
export const transformation = {
	id: {
		type: "number",
		autoIncrements: true,
	},
	userTag: {
		type: "text",
		columnName: "user_tag",
	},
	wins: { type: "number" },
	losses: { type: "number" },
	division: { type: "number" },
	exp: { type: "number" },
	rExp: {
		type: "number",
		columnName: "r_exp",
	},
	rankId: {
		type: "number",
		columnName: "rank_id",
	},
	rank: { type: "text" },
};

export const getUserRank = async (
	user_tag: string
): Promise<UserRankProps[]> => {
	return await connection(tableName).where({ user_tag: user_tag });
};

export const create = async (
	data: Omit<UserRankProps, "id">
): Promise<UserRankProps[]> => {
	return await connection(tableName).insert(data).returning("*");
};
export const update = async (
	params: { user_tag: string },
	data: Partial<Omit<UserRankProps, "id">>
): Promise<UserRankProps[]> => {
	return await connection(tableName)
		.where({ user_tag: params.user_tag })
		.update(data);
};
