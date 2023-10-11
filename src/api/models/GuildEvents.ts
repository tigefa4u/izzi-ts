import { GuildEventsCreateProps, GuildEventsProps, GuildEventsUpdateProps } from "@customTypes/guildEvents";
import connection from "db";
import { RAID_PING_NAME } from "helpers/constants/constants";

const tableName = "guild_events";

export const get = async (guild_id: string): Promise<GuildEventsProps[]> => {
	return connection(tableName).where({
		guild_id,
		is_deleted: false 
	});
};

export const update = async (params: { guild_id: string; id?: number; }, data: GuildEventsUpdateProps) => {
	return connection(tableName).where(params).update(data);
};

export const create = async (data: GuildEventsCreateProps) => {
	return connection(tableName).insert(data);
};

export const getByName = async ({ guild_id, name }: { guild_id: string; name: string}): Promise<GuildEventsProps> => {
	const res = await connection(tableName).where({
		guild_id,
		name,
		is_deleted: false
	});
	return res[0];
};

export const delRaidPing = async (guild_id: string) => {
	return connection(tableName).where({
		guild_id,
		name: RAID_PING_NAME
	}).del();
};