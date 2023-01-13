import { DungeonCreateProps, DungeonOpponentProps, DungeonProps, DungeonUpdateProps } from "@customTypes/dungeon";
import connection from "db";

const tableName = "dungeons";
const userRanks = "user_ranks";
const users = "users";

export const get = async (user_tag: string): Promise<DungeonProps> => {
	return connection(tableName).where({ user_tag }).then((res) => res[0]);
};

export const create = async (data: DungeonCreateProps) => {
	return connection(tableName).insert(data).onConflict("user_tag").ignore();
};

export const update = async (user_tag: string, data: DungeonUpdateProps) => {
	return connection(tableName).where({ user_tag }).update(data);
};

export const del = async (user_tag: string) => {
	return connection(tableName).where({ user_tag }).del();
};

export const getRandomPlayer = async (exclude_tag: string, params: {
    rank_id: number;
}): Promise<DungeonOpponentProps[]> => {
	const db = connection;
	const query = db.select(db.raw(`${tableName}.*, ${userRanks}.rank_id, ${userRanks}.rank`))
		.from(tableName)
		.innerJoin(userRanks, `${tableName}.user_tag`, `${userRanks}.user_tag`)
		.innerJoin(users, `${tableName}.user_tag`, `${users}.user_tag`)
		.whereNot(`${tableName}.user_tag`, exclude_tag)
		.whereRaw(`cast(${tableName}.metadata->> ? as boolean) = ?`, [ "isValid", true ])
		.where(`${users}.is_banned`, false)
		.where(`${userRanks}.rank_id`, params.rank_id)
		.orderByRaw("random()");
	return query; 
};