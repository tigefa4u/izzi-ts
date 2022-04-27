import { UserProps } from "@customTypes/users";
import connection from "db";

const tableName = "user_zone_backup";

const attributes = {
	id: {
		type: "integer",
		autoIncrement: true
	},
	userTag: {
		type: "string",
		columnName: "user_tag"
	},
	maxRuin: {
		type: "integer",
		columnName: "max_ruin"
	},
	maxFloor: {
		type: "integer",
		columnName: "max_floor"
	}
};

type T = {
    id: number;
    user_tag: string;
    max_ruin: number;
	max_floor: number;
}
export const createOrUpdate = async (data: Omit<T, "id">): Promise<T> => {
	const db = connection;
	const result = await db(tableName).where({ user_tag: data.user_tag });
	const zoneBackup = result[0];
	if (!zoneBackup) {
		await db(tableName).insert(data);
	} else {
		await db(tableName).where({ id: zoneBackup.id }).update(data);
	}
	return zoneBackup;
};