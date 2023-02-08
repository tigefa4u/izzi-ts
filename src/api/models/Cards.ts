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
		columnName: "is_referral_card"
	}
};
export const get: (params: CardParams) => Promise<CardProps[]> = async function (params) {
	const db = connection;
	return db.select("*").from(tableName).where(params);
};

export const getRandomCard: (
  params: CardParams & { group_with?: number; group_id?: number; },
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
		.where(queryParams);
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

export const getBySeries: (params: {
	series: string;
}) => Promise<CardProps[]> = async function(params) {
	const db = connection;
	const query = db
		.select(db.raw(`distinct ${tableName}.character_id`))
		.from(tableName)
		.where(`${tableName}.series`, "ilike", `%${params.series}%`);

	return query;
};