import { StreakCreateProps, StreakProps, StreakUpdateProps } from "@customTypes/streaks";
import connection from "db";
import { isEmptyObject } from "utility";

const tableName = "streaks";

export const transformation = {
	id: { type: "number" },
	userTag: {
		type: "string",
		columnName: "user_tag"
	},
	username: { type: "string" },
	dailyQuestStreaks: {
		type: "number",
		columnName: "daily_quest_streaks",
		defaultsTo: 0
	},
	dailyQuestUpdatedAt: {
		type: "timestamp",
		columnName: "daily_quest_updated_at"
	},
	voteStreak: {
		type: "number",
		columnName: "vote_streak",
		defaultsTo: 0
	},
	voteStreakUpdatedAt: {
		type: "timestamp",
		columnName: "vote_streak_updated_at"
	},
	metadata: { type: "jsonb" }
};

export const get = async (params: { user_tag: string; }): Promise<StreakProps[]> => {
	const db = connection;
	return db.select(
		"id",
		"user_tag",
		"username",
		"daily_quest_streaks",
		"daily_quest_updated_at",
		"vote_streak",
		"vote_streak_updated_at",
		"metadata"
	    )
		.from(tableName)
		.where("user_tag", params.user_tag);
};

export const create = async (data: StreakCreateProps) => {
	return connection(tableName).insert(data);
};

export const update = async (params: { user_tag: string; }, data: StreakUpdateProps) => {
	const db = connection;
	const bodyParams = {};
	if (data.daily_quest_streaks) {
		Object.assign(bodyParams, {
			daily_quest_streaks: db.raw(`daily_quest_streaks + ${data.daily_quest_streaks}`),
			daily_quest_updated_at: db.raw("now()") 
		});
	}
	if (data.vote_streak) {
		Object.assign(bodyParams, {
			daily_quest_streaks: db.raw(`vote_streak + ${data.vote_streak}`),
			vote_streak_updated_at: db.raw("now()") 
		});
	}
	if (data.metadata) {
		Object.assign(bodyParams, { metadata: data.metadata });
	}
	if (isEmptyObject(bodyParams)) return;

	return db(tableName).where("user_tag", params.user_tag).update(bodyParams);
};
