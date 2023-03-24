import { PaginationProps } from "@customTypes/pagination";
import {
	CreateWorldBossBattleProps,
	WorldBossBattleProps,
} from "@customTypes/raids/worldBoss";
import connection from "db";
import loggers from "loggers";

const tableName = "world_boss_battles";
const users = "users";

export const create = async (data: CreateWorldBossBattleProps) => {
	loggers.info("Creating world boss battle: " + JSON.stringify(data));
	return connection(tableName).insert(data);
};

export const get = async (
	params: { user_tag?: string; fromDate?: Date },
	pagination: PaginationProps = {
		limit: 10,
		offset: 0,
	}
): Promise<WorldBossBattleProps[]> => {
	const db = connection;
	let query = db
		.select(
			db.raw(`${tableName}.id, ${tableName}.user_tag, ${tableName}.damage_dealt,
    ${tableName}.loot, ${tableName}.created_at, 
    count(1) over() as total_count`)
		)
		.from(tableName)
		.orderBy(`${tableName}.created_at`, "desc");

	if (params.user_tag) {
		query = query.where({ user_tag: params.user_tag });
	}
	if (params.fromDate) {
		query = query.where(`${tableName}.created_at`, ">=", params.fromDate);
	}

	query = query.limit(pagination.limit).offset(pagination.offset);
	return query;
};

export const fetchTotalDamageDealt = async ({
	fromDate,
	user_tag,
}: {
  fromDate: Date;
  user_tag: string;
}) => {
	const db = connection;
	return db(tableName)
		.where("user_tag", user_tag)
		.where("created_at", ">=", fromDate)
		.sum("damage_dealt")
		.then((res) => res[0]);
};

export const getForLeaderboard = async (params: { fromDate: Date }): Promise<WorldBossBattleProps[]> => {
	const db = connection;
	return db
		.select(
			db.raw(
				`distinct on (${tableName}.user_tag) damage_dealt, ${tableName}.user_tag, ${users}.username`
			)
		)
		.from(tableName)
		.innerJoin(users, `${users}.user_tag`, `${tableName}.user_tag`)
		.orderByRaw(`${tableName}.user_tag, ${tableName}.damage_dealt desc`)
		.where(`${tableName}.created_at`, ">=", params.fromDate)
		.where(`${tableName}.damage_dealt`, ">", 0)
		.limit(10);
};
