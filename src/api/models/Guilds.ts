import {
	GuildCreateProps,
	GuildMaterializedViewProps,
	GuildMemberAndItemCountProps,
	GuildParams,
	GuildProps,
	GuildUpdateProps,
} from "@customTypes/guilds";
import connection from "db";

const tableName = "guilds";
export const transformation = {
	id: {
		type: "number",
		autoIncrement: true,
	},
	guildId: {
		type: "string",
		columnName: "guild_id",
	},
	guildName: {
		type: "string",
		columnName: "guild_name",
	},
	guildStats: {
		columnName: "guild_stats",
		type: "json",
	},
	name: { type: "string" },
	prefix: {
		type: "string",
		defaultsTo: "iz",
	},
	gold: {
		type: "number",
		defaultsTo: 0,
	},
	points: {
		type: "number",
		defaultsTo: 0,
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

export const get = async (params: GuildParams): Promise<GuildProps[]> => {
	return await connection(tableName).where(params);
};

export const create = async (data: GuildCreateProps | GuildCreateProps[]) => {
	return await connection(tableName).insert(data);
};

export const del = async (params: { id: number }) => {
	return await connection(tableName).where(params).del();
};

export const update = async (params: GuildParams, data: GuildUpdateProps) => {
	return await connection(tableName).where(params).update(data);
};

export const getDetails = async (params: {
  id: number;
}): Promise<GuildMaterializedViewProps[]> => {
	return await connection("guild_details").where({ guild_id: params.id });
};

export const getMemberAndItemCount = async (params: { id: number }): Promise<GuildMemberAndItemCountProps[]> => {
	const db = connection;
	return db
		.raw(
			`(select 'members' as type, count(*) from guild_members 
	where guild_id = ${params.id}) union
(select 'items' as type, count(*) from guild_items where guild_id = ${params.id})`
		)
		.then((res) => res.rows);
};
