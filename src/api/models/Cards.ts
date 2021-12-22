import { CardParams, CardProps, RandomCardProps } from "@customTypes/cards";
import connection from "db";

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
};
export const get: (params: CardParams) => Promise<CardProps[]> = async function (params) {
	const db = connection;
	return db.select("*").from(tableName).where(params);
};
export const getRandomCard: (
  params: CardParams,
  limit: number
) => Promise<RandomCardProps[]> = async function (params, limit = 1) {
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
		.where(params);
	if (params.is_event) {
		query = query.where(`${tableName}.has_event_ended`, "false");
	} else {
		query = query.where(`${tableName}.is_random`, "true");
	}
	query = query.orderByRaw("random()").limit(limit);

	return query;
};
