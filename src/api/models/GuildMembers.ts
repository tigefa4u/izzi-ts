import {
	GuildMemberCreateProps,
	GuildMemberProps,
	GuildMemberResponseProps,
	GuildMemberUpdateProps,
} from "@customTypes/guildMembers";
import { PaginationProps } from "@customTypes/pagination";
import connection from "db";

const tableName = "guild_members";
const users = "users";

const refresh_view = "REFRESH MATERIALIZED VIEW guild_details";

export const transformation = {
	id: {
		type: "number",
		autoIncrement: true,
	},
	guildId: {
		columnName: "guild_id",
		type: "number",
		ref: "guilds",
	},
	userId: {
		columnName: "user_id",
		type: "number",
		ref: "users",
	},
	isLeader: {
		columnName: "is_leader",
		type: "boolean",
		defaultsTo: false,
	},
	isViceLeader: {
		columnName: "is_vice_leader",
		type: "boolean",
		defaultsTo: false,
	},
	isAdmin: {
		type: "boolean",
		defaultsTo: false,
		columnName: "is_admin",
	},
	isInWar: {
		type: "boolean",
		defaultsTo: false,
		columnName: "is_in_war",
	},
	createdAt: {
		columnName: "created_at",
		type: "timestamp",
	},
	updatedAt: {
		columnName: "updated_at",
		type: "timestamp",
	},
};

export const get = async (params: {
  user_id: number;
}): Promise<GuildMemberProps[]> => {
	const db = connection;
	const query = db.select("*").from(tableName).where(params);

	return query;
};

export const getAll = async (
	params: { guild_id: number },
	pagination: PaginationProps = {
		limit: 10,
		offset: 0,
	}
): Promise<GuildMemberResponseProps[]> => {
	const db = connection;
	const query = db
		.select(db.raw(`${tableName}.*, ${users}.user_tag, ${users}.username, ${users}.level,
			count(*) over() as total_count`))
		.from(tableName)
		.innerJoin(users, `${tableName}.user_id`, `${users}.id`)
		.where(params)
		.limit(pagination.limit)
		.offset(pagination.offset);

	return query;
};

export const update = async (
	params: { id?: number; user_id?: number; },
	data: GuildMemberUpdateProps
) => {
	const db = connection;
	const result = await db(tableName).where(params).update(data);
	const keys = Object.keys(data);
	if (keys.includes("is_leader") || keys.includes("is_vice_leader") || keys.includes("is_admin")) {
		await db.raw(refresh_view);
	}
	return result;
};

export const del = async (params: { id?: number; guild_id?: number }) => {
	const result = await connection(tableName).where(params).del();
	await connection.raw(refresh_view);
	return result;
};

export const create = async (
	data: GuildMemberCreateProps | GuildMemberCreateProps[]
) => {
	const result = await connection(tableName).insert(data);
	await connection.raw(refresh_view);
	return result;
};
