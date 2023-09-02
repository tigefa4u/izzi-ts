import { DungeonCreateProps, DungeonOpponentProps, DungeonProps, DungeonUpdateProps } from "@customTypes/dungeon";
import connection from "db";

const tableName = "dungeons";
const userRanks = "user_ranks";
const users = "users";
const guild_members = "guild_members";
const guilds = "guilds";

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

export const getRandomPlayer = async (params: {
    exclude_tag: string;
	mmr: number;
}): Promise<DungeonOpponentProps[]> => {
	const mmrBucket = {
		low: 0,
		high: 100
	};
	const mmr = params.mmr;
	if (mmr <= 100) {
		mmrBucket.low = 0;
		mmrBucket.high = 100;
	} else if (mmr <= 500) {
		mmrBucket.high = 500;
		mmrBucket.low = 100;
	} else if (mmr <= 1500) {
		mmrBucket.low = 500;
		mmrBucket.high = 1500;
	} else if (mmr <= 3000) {
		mmrBucket.low = 1500;
		mmrBucket.high = 3000;
	} else {
		mmrBucket.low = 3000;
		mmrBucket.high = 1000000;
	}
	const db = connection;
	const query = db.select(db.raw(`${tableName}.*, ${userRanks}.rank_id, ${userRanks}.rank`))
		.from(tableName)
		// .innerJoin(users, `${tableName}.user_tag`, `${users}.user_tag`)
		.innerJoin(userRanks, `${tableName}.user_tag`, `${userRanks}.user_tag`)
		.whereRaw(`cast(${tableName}.metadata->> ? as boolean) = ?`, [ "isValid", true ])
		// .where(`${users}.is_banned`, false)
		.whereBetween(`${userRanks}.match_making_rate`, [ mmrBucket.low, mmrBucket.high ])
		.orderByRaw("random()")
		.limit(1);
	return query; 
};