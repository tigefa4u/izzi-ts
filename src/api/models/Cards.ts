import { CardParams, CardProps, RandomCardProps } from "@customTypes/cards";
import connection from "db";
import { clone } from "utility";

const tableName = "cards";
const characters = "characters";
const abilities = "passives";
export const transformation = {
	id: {
		type: "number",
		autoIncrement: true,
	},
	filepath: {
		type: "string",
		required: true,
	},
	copies: {
		type: "number",
		default: 1,
	},
	series: { type: "string" },
	rank: {
		type: "string",
		default: "silver",
	},
	characterId: {
		type: "number",
		ref: "characters",
		columnName: "character_id",
	},
	isLogo: {
		type: "boolean",
		default: false,
		columnName: "is_logo",
	},
	createdAt: {
		type: "timestamp",
		columnName: "created_at",
	},
	updatedAt: {
		type: "timestamp",
		columnName: "updated_at",
	},
	isReferralCard: {
		type: "boolean",
		columnName: "is_referral_card",
	},
	isWorldBoss: {
		type: "boolean",
		columnName: "is_world_boss",
	},
};
export const get: (
  params: CardParams & { id?: number }
) => Promise<CardProps[]> = async function (params) {
	const db = connection;
	return db.select("*").from(tableName).where(params);
};

export const getRandomCard: (
  params: CardParams & { group_with?: number; group_id?: number },
  limit: number
) => Promise<RandomCardProps[]> = async function (params, limit = 1) {
	const queryParams = clone(params);

	const group_with = queryParams.group_with;
	const group_id = queryParams.group_id;
	delete queryParams.group_with;
	delete queryParams.group_id;
	const db = connection;
	let query = db
		.select(
			db.raw(
				`${tableName}.*, ${characters}.name, 
                    ${characters}.type, ${characters}.stats, ${abilities}.name as abilityname`
			)
		)
		.from(tableName)
		.leftJoin(characters, `${tableName}.character_id`, `${characters}.id`)
		.leftJoin(abilities, `${characters}.passive_id`, `${abilities}.id`)
		.where(queryParams)
		.andWhere({ is_world_boss: false });
	if (queryParams.is_event) {
		query = query.where(`${tableName}.has_event_ended`, "false");
	} else {
		query = query.where(`${tableName}.is_random`, "true");
	}
	if (queryParams.is_referral_card) {
		query = query.where(`${tableName}.is_referral_card`, true);
	} else {
		query = query.where(`${tableName}.is_referral_card`, false);
	}
	if (!queryParams.series) {
		query = query.whereNot(`${tableName}.series`, "=", "%xenex%");
	}
	if (group_id) {
		query = query.where(`${tableName}.group_id`, group_id);
	}
	if (group_with) {
		query = query.where(`${tableName}.group_with`, group_with);
	}
	query = query.orderByRaw("random()").limit(limit);

	return query;
};

export const getBySeries: (params: { series: string }) => Promise<CardProps[]> =
  async function (params) {
  	const db = connection;
  	const query = db
  		.select(db.raw(`distinct ${tableName}.character_id`))
  		.from(tableName)
  		.where(`${tableName}.series`, "ilike", `%${params.series}%`);

  	return query;
  };

export const getForWorldBoss = (params: {
  rank: string;
  hasEventEnded?: boolean;
  id?: number | number[];
  filter?: { fromDate: Date; toDate: Date }
}): Promise<RandomCardProps[]> => {
	const db = connection;
	let query = db
		.select(
			db.raw(`
		${tableName}.id,
		${tableName}.filepath,
		${tableName}.metadata,
		${tableName}.rank,
		${tableName}.character_id,
		${tableName}.is_world_boss,
		${tableName}.created_at,
		${tableName}.shard_cost,
		${characters}.name, ${characters}.type, ${characters}.stats, ${abilities}.name as abilityname
	`)
		)
		.from(tableName)
		.innerJoin(characters, `${tableName}.character_id`, `${characters}.id`)
		.innerJoin(abilities, `${characters}.passive_id`, `${abilities}.id`)
		.where({ is_world_boss: true })
		.where({ rank: params.rank });

	if (typeof params.hasEventEnded === "boolean") {
		query = query.where(`${tableName}.has_event_ended`, params.hasEventEnded);
	}
	if (typeof params.id === "object") {
		query = query.whereIn(`${tableName}.id`, params.id);
	} else if (typeof params.id === "number") {
		query = query.where(`${tableName}.id`, params.id);
	}
	if (params.filter) {
		query = query.where(`${tableName}.created_at`, ">=", params.filter.fromDate)
			.where(`${tableName}.created_at`, "<", params.filter.toDate);
	}

	return query;
};

export const finishWbChallenge = async (cids: number[]) => {
	return connection(tableName)
		.whereIn("character_id", cids)
		.update({ has_event_ended: true });
};

export const getAllWorldBoss = (
	filter: { fromDate: Date; toDate: Date; },
	pagination = {
		limit: 10,
		offset: 0,
	}
): Promise<RandomCardProps[]> => {
	const db = connection;
	const query = db
		.select(
			db.raw(`
		${tableName}.id,
		${tableName}.filepath,
		${tableName}.metadata,
		${tableName}.rank,
		${tableName}.character_id,
		${tableName}.is_world_boss,
		${tableName}.created_at,
		${tableName}.shard_cost,
		${characters}.name, ${characters}.type, ${characters}.stats, ${abilities}.name as abilityname,
		count(1) over() as total_count
	`)
		)
		.from(tableName)
		.innerJoin(characters, `${tableName}.character_id`, `${characters}.id`)
		.innerJoin(abilities, `${characters}.passive_id`, `${abilities}.id`)
		.where({
			is_world_boss: true,
			has_event_ended: false,
		})
		.where({ rank: "platinum" })
		.where(`${tableName}.created_at`, ">=", filter.fromDate)
		.where(`${tableName}.created_at`, "<", filter.toDate)
		.limit(pagination.limit)
		.offset(pagination.offset);

	return query;
};
