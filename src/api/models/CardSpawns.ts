import { CardSpawnProps } from "@customTypes/cardSpawns";
import connection from "db";

const tableName = "redirect_drops";
export const transformation = {
	id: {
		type: "number",
		autoIncrement: true,
	},
	channels: { type: "jsonb" },
	guildId: {
		columnName: "guild_id",
		type: "string",
	},
};


export const get = async (params: {
  guild_id: string;
}): Promise<CardSpawnProps[]> => {
	return await connection(tableName).where(params);
};

export const update = async <T>(
	params: { id?: number; guild_id?: string },
	data: T
) => {
	return await connection(tableName).where(params).update(data);
};

export const del = async (params: { id?: number; guild_id?: string }) => {
	return await connection(tableName).where(params).del();
};

export const create = async <T>(data: T) => {
	return await connection(tableName).insert(data);
};
