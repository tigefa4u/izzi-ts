import { CreateDarkZoneProfileProps, DarkZoneProfileProps } from "@customTypes/darkZone/profile";
import { RawUpdateReturnType } from "@customTypes/utility";
import connection from "db";

export const tableName = "dark_zone_user_profiles";

const colArr = [
	"id",
	"user_tag",
	"fragments",
	"floor",
	"max_floor",
	"reached_max_floor_at",
	"level",
	"exp",
	"r_exp",
	"selected_team_id",
	"metadata",
	"created_at",
	"inventory_count",
];

export const get = async (user_tag: string): Promise<DarkZoneProfileProps> => {
	return connection
		.select(colArr)
		.from(tableName)
		.where({
			user_tag,
			is_deleted: false,
		})
		.then((res) => res[0]);
};

export const create = async (data: CreateDarkZoneProfileProps) => {
	return connection(tableName).insert(data);
};

export const update = async (
	user_tag: string,
	data: Partial<DarkZoneProfileProps>
): Promise<DarkZoneProfileProps[]> =>
	connection(tableName)
		.where({
			user_tag,
			is_deleted: false,
		})
		.update(data)
		.returning(colArr);

export const rawUpdate = async (
	user_tag: string,
	data: RawUpdateReturnType<Partial<DarkZoneProfileProps>>
): Promise<DarkZoneProfileProps[]> => {
	return connection(tableName)
		.where({
			user_tag,
			is_deleted: false,
		})
		.update(data)
		.returning(colArr);
};

export const dbConnection = connection;
