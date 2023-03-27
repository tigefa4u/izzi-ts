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
	const query = db.select(db.raw(`
        ${tableName}.user_tag,
        sum(${tableName}.damage_dealt) as damage_dealt,
        ${users}.username, ${users}.id as user_id
    `)).from(tableName)
		.innerJoin(users, `${users}.user_tag`, `${tableName}.user_tag`)
		.where(`${tableName}.damage_dealt`, ">=", 0)
		.where(`${tableName}.created_at`, ">=", params.fromDate)
		.orderBy("damage_dealt", "desc")
		.groupBy([ `${tableName}.user_tag`, `${users}.username`, `${users}.id` ])
		.limit(10);

	return query;
};
