import {
	UserQuestParams,
	UserQuestProps,
	UserQuestCreateProps,
} from "@customTypes/quests/users";
import connection from "db";
import { Knex } from "knex";

const tableName = "user_quests";
const quests = "quests";

export const transformation = {
	id: { type: "number" },
	userTag: {
		type: "string",
		columnName: "user_tag",
	},
	username: { type: "string" },
	questId: {
		type: "number",
		columnName: "quest_id",
		ref: "quests.id",
	},
	reward: { type: "jsonb" },
	metadata: { type: "jsonb" },
	isDeleted: {
		type: "boolean",
		columnName: "is_deleted",
		defaultsTo: false,
	},
	createdAt: {
		type: "timestamp",
		columnName: "created_at",
	},
	updatedAt: {
		type: "timestamp",
		columnName: "updated_at",
	},
};

export const get = async (
	params: UserQuestParams & { useAndClause?: boolean }
): Promise<UserQuestProps[]> => {
	const db = connection;
	let query;

	query = db
		.select(
			"id",
			"user_tag",
			"username",
			"quest_id",
			"reward",
			"metadata",
			"is_deleted"
		)
		.from(tableName)
		.where({
			is_deleted: false,
			user_tag: params.user_tag 
		});

	const filterDate = (builder: Knex.QueryBuilder) => {
		if (params.is_daily_quest) {
			const fromDate = new Date().setHours(0, 0, 0, 0);
			const toDate = new Date().setHours(24, 0, 0, 0);
			if (params.useAndClause) {
				query = builder.andWhereBetween("created_at", [
					new Date(fromDate),
					new Date(toDate),
				]);
			} else {
				query = builder.orWhereBetween("created_at", [
					new Date(fromDate),
					new Date(toDate),
				]);
			}
		}
	};

	const qId = params.quest_id;
	if (typeof qId === "number") {
		query = query.andWhere(builder => {
			builder.where("quest_id", qId);
			filterDate(builder);
		});
	} else if (typeof qId === "object") {
		query = query.andWhere((builder) => {
			builder.whereIn("quest_id", qId);
			filterDate(builder);
		});
	}

	if (!qId) {
		filterDate(query);
	}
	return query;
};

export const create = async (data: UserQuestCreateProps) => {
	return connection(tableName).insert(data);
};

export const getByQuestType = async (params: {
  level: number;
  user_tag: string;
  type: string;
  is_daily?: boolean;
}): Promise<UserQuestProps[]> => {
	const db = connection;
	let query = db
		.select(
			db.raw(
				`${tableName}.id, ${tableName}.user_tag, ${tableName}.username, 
        ${tableName}.quest_id, ${tableName}.reward, ${tableName}.metadata, 
        ${tableName}.is_deleted, ${tableName}.created_at, ${tableName}.updated_at`
			)
		)
		.from(tableName)
		.innerJoin(quests, `${tableName}.quest_id`, `${quests}.id`)
		.where(`${quests}.min_level`, "<=", params.level)
		.andWhere(`${quests}.max_level`, ">=", params.level)
		.andWhere(`${quests}.type`, params.type)
		.andWhere(`${tableName}.user_tag`, params.user_tag);

	if (params.is_daily) {
		const fromDate = new Date().setHours(0, 0, 0, 0);
		const toDate = new Date().setHours(24, 0, 0, 0);
		query = query.andWhereBetween(`${tableName}.created_at`, [
			new Date(fromDate),
			new Date(toDate),
		]);
	}

	return query;
};
