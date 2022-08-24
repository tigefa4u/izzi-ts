import {
	UserCreateProps,
	UserParams,
	UserProps,
	UserUpdateProps,
} from "@customTypes/users";
import connection from "db";
import emoji from "emojis/emoji";
import { MAX_GOLD_THRESHOLD } from "helpers/constants";
import { DMUserViaApi } from "server/pipes/directMessage";
import { isEmptyValue } from "utility";

const tableName = "users";
export const transformation = {
	id: {
		type: "number",
		autoIncrement: true,
	},
	username: { type: "string" },
	userTag: {
		type: "string",
		columnName: "user_tag",
	},
	gold: { type: "number" },
	level: { type: "number" },
	exp: { type: "number" },
	rExp: {
		type: "number",
		columnName: "r_exp",
	},
	mana: { type: "number" },
	maxMana: {
		type: "number",
		columnName: "max_mana",
	},
	floor: { type: "number" },
	maxFloor: {
		type: "number",
		columnName: "max_floor",
	},
	ruin: { type: "number" },
	maxRuin: {
		type: "number",
		columnName: "max_ruin",
	},
	maxRuinFloor: {
		type: "number",
		columnName: "max_ruin_floor",
	},
	selectedCardID: {
		type: "number",
		columnName: "selected_card_id",
	},
	selectedTeamID: {
		type: "number",
		columnName: "selected_team_id",
	},
	raidPass: {
		type: "number",
		columnName: "raid_pass",
	},
	maxRaidPass: {
		type: "number",
		columnName: "max_raid_pass",
	},
	isMarried: {
		type: "boolean",
		columnName: "is_married",
	},
	voteStreak: {
		type: "number",
		columnName: "vote_streak",
	},
	votedAt: {
		type: "timestamp",
		columnName: "voted_at",
	},
	orbs: {
		type: "number",
		defaultsTo: 0,
	},
	createdAt: {
		type: "timestamp",
		columnName: "created_at",
	},
	updatedAt: {
		type: "timestamp",
		columnName: "updated_at",
	},
	reachedMaxRuinAt: {
		type: "timestamp",
		columnName: "reached_max_ruin_at",
	},
	dungeonMana: {
		type: "number",
		columnName: "dungeon_mana",
	},
	crystal: { type: "number" },
};

export const get: (
  params: UserParams
) => Promise<UserProps[] | undefined> = async (params) => {
	return await connection.select("*").from(tableName).where(params);
};

export const create: (data: UserCreateProps) => Promise<UserProps> = async (
	data
) => {
	return await connection(tableName)
		.insert(data, "*")
		.then((res) => res[0]);
};

export const update: (
  params: UserParams,
  data: UserUpdateProps
) => Promise<UserProps | undefined> = async (params, data) => {
	if (data.gold && data.gold > MAX_GOLD_THRESHOLD) {
		delete data.gold;
		if (params.user_tag) {
			const message = "Your Gold has reached max threshold " +
			`__${MAX_GOLD_THRESHOLD}__ ${emoji.gold} and will not be updated`;
			DMUserViaApi(params.user_tag, { content: message, });
		}
	}
	if (isEmptyValue(data)) return;
	return await connection(tableName).where(params).update(data);
};

export const getPlayerCount = async (
	params?: Pick<UserProps, "is_active">
): Promise<{ count: string; status: string }[]> => {
	const db = connection;
	const query = db
		.select(db.raw("'active' as status, count(*)"))
		.from(tableName)
		.where(`${tableName}.is_active`, true)
		.union((builder) =>
			builder.select(db.raw("'total' as status, count(*)")).from(tableName)
		);
	return query;
};
