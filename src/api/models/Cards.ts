import { CardParams, CardProps, RandomCardProps } from "@customTypes/cards";
import connection from "db";
import { RankProps } from "helpers/helperTypes";
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
	isDarkZone: {
		type: "boolean",
		columnName: "is_dark_zone"
	},
	metadata: { type: "jsonb" },
	cardTypeMetadata: {
		type: "jsonb",
		columnName: "card_type_metadata" 
	},
};
export const get: (
  params: CardParams & { id?: number }
) => Promise<CardProps[]> = async function (params) {
	const db = connection;
	const clonedParams = clone(params);
	const rank = clonedParams.rank;
	if (rank) {
		delete clonedParams.rank;
	}

	let query = db.select("*").from(tableName).where(clonedParams);

	if (typeof rank === "string") {
		query = query.where("rank", "ilike", `%${rank}%`);
	}
	return query;
};

export const getRandomCard: (
  params: CardParams & { group_with?: number; group_id?: number },
  limit: number
) => Promise<RandomCardProps[]> = async function (params, limit = 1) {
	const queryParams = clone(params);
	const rank = queryParams.rank;
	const character_id = queryParams.character_id;
	const isDarkZone = queryParams.is_dark_zone;
	delete queryParams.is_dark_zone;
	delete queryParams.rank;
	delete queryParams.character_id;
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

	if (typeof rank === "string") {
		query = query.where(`${tableName}.rank`, "=", rank);
	} else if (typeof rank === "object") {
		query = query.whereIn(`${tableName}.rank`, rank);
	}
	if (typeof character_id === "number") {
		query = query.where(`${tableName}.character_id`, "=", character_id);
	} else if (typeof character_id === "object") {
		query = query.whereIn(`${tableName}.character_id`, character_id);
	}
	if (queryParams.is_event) {
		query = query.where(`${tableName}.has_event_ended`, "false");
	} else if (typeof queryParams.is_random === "boolean") {
		query = query.where(`${tableName}.is_random`, queryParams.is_random);	
	} else {
		query = query.where(`${tableName}.is_random`, "true");
	}
	if (queryParams.is_referral_card) {
		query = query.where(`${tableName}.is_referral_card`, true);
	} else {
		query = query.where(`${tableName}.is_referral_card`, false);
	}
	if (typeof isDarkZone === "boolean") {
		query = query.where(`${tableName}.is_dark_zone`, isDarkZone);
	}
	// Enable the else case if you do not want to spwan dark zone cards
	// in normal raids.
	// else {
	// 	query = query.where(`${tableName}.is_dark_zone`, false);
	// }
	if (!queryParams.series) {
		query = query.whereNot(`${tableName}.series`, "=", "xenex");
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

export const getBySeries: (params: { series: string | string[]; }) => Promise<CardProps[]> =
  async function (params) {
  	const db = connection;
  	let query = db
  		.select(db.raw(`distinct ${tableName}.character_id`))
  		.from(tableName);

  	if (typeof params.series === "string") {
  		query = query.where(`${tableName}.series`, "ilike", `%${params.series}%`);
  	} else if (typeof params.series === "object") {
  		query = query.where(
  			`${tableName}.series`,
  			"~*",
  			`(${params.series.join("|")}).*`
  		);
  	}

  	return query;
  };

export const getForWorldBoss = (params: {
  rank: RankProps;
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
