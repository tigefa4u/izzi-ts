import { PLProps } from "@customTypes/powerLevel";
import connection from "db";

const tableName = "ranks";
export const transformation = {
	id: {
		type: "number",
		autoIncrement: true,
	},
	rank: { type: "string", },
	rankId: {
		type: "number",
		columnName: "rank_id" 
	},
	maxPower: {
		type: "number",
		columnName: "max_power",
	},
	maxLevel: {
		type: "number",
		columnName: "max_level",
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

export const get = async (params: { rank: string }): Promise<PLProps[]> => {
	const db = connection;
	const query = await db
		.select("*")
		.from(tableName)
		.where(params);

	return query;
};