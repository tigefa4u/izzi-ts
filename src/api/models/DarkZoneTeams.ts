import { DzTeamCreateProps, DzTeamProps } from "@customTypes/darkZone/teams";
import connection from "db";

const tableName = "dark_zone_teams";

export const create = async (data: DzTeamCreateProps) => connection(tableName).insert(data);

export const update = async (user_tag: string, data: Partial<Pick<DzTeamProps, "team" | "metadata">>) => {
	return connection(tableName).where({ user_tag }).update(data);
};

export const get = async (params: { id?: number; user_tag?: string; }): Promise<DzTeamProps> => 
	connection.select("id", "team", "user_tag", "metadata").from(tableName).where(params)
		.then((res) => res[0]);
