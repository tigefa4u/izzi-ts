import { PaginationProps } from "@customTypes/pagination";
import { CreateWorldBossBattleProps, WorldBossBattleProps } from "@customTypes/raids/worldBoss";
import connection from "db";

const tableName = "world_boss_battles";

export const create = async (data: CreateWorldBossBattleProps) => {
	connection(tableName).insert(data);
};

export const get = async (params: { user_tag?: string; fromDate?: Date; }, pagination: PaginationProps = {
	limit: 10,
	offset: 0
}): Promise<WorldBossBattleProps[]> => {
	const db = connection;
	let query = db.select(db.raw(`${tableName}.id, ${tableName}.user_tag, ${tableName}.damage_dealt,
    ${tableName}.loot, ${tableName}.boss_stats, count(1) over() as total_count`))
		.from(tableName)
		.orderBy(`${tableName}.created_at`, "desc");

	if (params.user_tag) {
		query = query.where({ user_tag: params.user_tag });
	}
	if (params.fromDate) {
		query = query.where(`${tableName}.created_at`, ">=", params.fromDate);
	}

	query = query.limit(pagination.limit)
		.offset(pagination.offset);
	return query;
};
