import { UserBlacklistCreateProps, UserBlacklistProps, UserBlacklistUpdateProps } from "@customTypes/userBlacklists";
import connection from "db";

const tableName = "user_blacklists";

export const get = async (tag: string): Promise<UserBlacklistProps[]> => {
	return connection(tableName).where({ user_tag: tag });
};

export const create = async (data: UserBlacklistCreateProps) => {
	return connection(tableName).insert(data);
};

export const update = async (tag: string, data: UserBlacklistUpdateProps) => {
	return connection(tableName).where({ user_tag: tag }).update(data);
};

export const del = async (tag: string) => connection(tableName).where({ user_tag: tag }).del();