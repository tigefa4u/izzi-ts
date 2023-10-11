/* eslint-disable prefer-const */
import {
	UserQuestParams,
	UserQuestProps,
	UserQuestCreateProps,
} from "@customTypes/quests/users";
import connection from "db";
import { getDailyQuestDates, getWeeklyQuestDates } from "helpers/quest";
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

	const filterDate = (builder: Knex.QueryBuilder, isWeeklyQuest: boolean) => {
		let fromDate, toDate;
		const _dailyDates = getDailyQuestDates();
		fromDate = _dailyDates.fromDate;
		toDate = _dailyDates.toDate;
		if (isWeeklyQuest) {
			/**
				 * Weekly quest resets every Monday 00.00.00 hrs.
				 * The duration is from Monday to end of Sunday.
				 */
			const _weeklydates = getWeeklyQuestDates();
			fromDate = _weeklydates.fromDate;
			toDate = _weeklydates.toDate;
		}
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
	};

	const qId = params.quest_id;
	if (typeof qId === "number") {
		query = query.andWhere(builder => {
			builder.where("quest_id", qId);
			filterDate(builder, false);
		});

		if (params.is_weekly_quest) {
			query = query.andWhere((builder) => {
				builder.where("quest_id", qId);
				filterDate(builder, true);
			});
		}
	} else if (typeof qId === "object") {
		query = query.andWhere((builder) => {
			builder.whereIn("quest_id", qId);
			filterDate(builder, false);
		});

		if (params.is_weekly_quest) {
			query = query.andWhere((builder) => {
				builder.whereIn("quest_id", qId);
				filterDate(builder, true);
			});
		}
	}

	if (!qId) {
		filterDate(query, false);

		if (params.is_weekly_quest) {
			filterDate(query, true);
		}
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
  is_weekly?: boolean;
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

	if (params.is_daily || params.is_weekly) {
		const _dailyDates = getDailyQuestDates();
		let fromDate = _dailyDates.fromDate;
		let toDate = _dailyDates.toDate;
		if (params.is_weekly) {
			/**
			 * Weekly quest resets every Monday 00.00.00 hrs.
			 * The duration is from Monday to end of Sunday.
			 */
			const _weeklydates = getWeeklyQuestDates();
			fromDate = _weeklydates.fromDate;
			toDate = _weeklydates.toDate;
		}
		query = query.andWhereBetween(`${tableName}.created_at`, [
			new Date(fromDate),
			new Date(toDate),
		]);
	}

	return query;
};
