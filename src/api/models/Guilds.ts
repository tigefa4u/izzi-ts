import {
	GuildCreateProps,
	GuildMaterializedViewProps,
	GuildMemberAndItemCountProps,
	GuildParams,
	GuildProps,
	GuildUpdateProps,
} from "@customTypes/guilds";
import connection from "db";

export const tableName = "guilds";
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
	itemStats: {
		columnName: "item_stats",
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

export const incrTraffic = async (guild_id: string) => {
	return connection(tableName).where({ guild_id }).update({ traffic: connection.raw("traffic + 1") });
};

export const get = async (params: GuildParams): Promise<GuildProps[]> => {
	return connection(tableName).where(params);
};

export const getByGuildIds = async (guild_ids: string[]): Promise<GuildProps[]> => {
	return connection(tableName).whereIn("guild_id", guild_ids);
};

export const getAll = async (): Promise<GuildProps[]> => {
	return connection(tableName);
};

export const create = async (data: GuildCreateProps | GuildCreateProps[]) => {
	return connection(tableName).insert(data);
};

export const del = async (params: { id: number }) => {
	return connection(tableName).where(params).del();
};

export const update = async (params: GuildParams, data: GuildUpdateProps) => {
	return connection(tableName).where(params).update(data);
};

export const getDetails = async (params: {
  id: number;
}): Promise<GuildMaterializedViewProps[]> => {
	return connection("guild_details").where({ guild_id: params.id });
};

export const getMemberAndItemCount = async (params: {
  id: number;
}): Promise<GuildMemberAndItemCountProps[]> => {
	const db = connection;
	return db
		.raw(
			`(select 'members' as type, count(*) from guild_members 
	where guild_id = ${params.id}) union
(select 'items' as type, count(*) from guild_items where guild_id = ${params.id})`
		)
		.then((res) => res.rows);
};

export const updateMMR = async (
	params: {
    id: number;
    mmr: number;
  },
	operation: "inc" | "dec"
) => {
	const db = connection;
	let query = db(tableName).where({ id: params.id });
	const columnName = "match_making_rate";

	if (operation === "inc") {
		query = query.update({ [columnName]: db.raw(`${columnName} + ?`, [ params.mmr ]), });
	} else if (operation === "dec") {
		query = query.update({
			[columnName]: db.raw(
				`CASE WHEN ${columnName} - ? < 0 THEN 0 ELSE ${columnName} - ? END`,
				[ params.mmr, params.mmr ]
			),
		});
	}
	query = query.returning([ "id", "guild_id", columnName ]);

	return query;
};

export const dbConnection = connection;
