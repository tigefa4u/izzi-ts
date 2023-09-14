import { FilterProps } from "@customTypes";
import {
	CustomServerCardAndCharacterProps,
	CustomServerCardProps,
} from "@customTypes/guildEvents/customServerCards";
import connection from "db";

const tableName = "custom_server_cards";
const abilities = "passives";
const characters = "characters";

const cols = [
	`${tableName}.id`,
	`${tableName}.is_deleted`,
	`${tableName}.series`,
	`${tableName}.character_id`,
	`${tableName}.guild_ids`,
	`${tableName}.metadata`,
	`${tableName}.submitted_by`,
];

export const getAll = async (
	params: { guild_id: string } & Pick<
    FilterProps,
    "abilityname" | "name" | "type" | "series"
  >,
	pagination = {
		limit: 10,
		offset: 0,
	}
): Promise<CustomServerCardAndCharacterProps[]> => {
	const db = connection;
	let query = db
		.select(cols)
		.select(db.raw("count(*) over() as total_count"))
		.select(
			db.raw(
				`${characters}.name, ${characters}.type, ${characters}.stats, ${abilities}.name as abilityname`
			)
		)
		.from(tableName)
		.innerJoin(characters, `${characters}.id`, `${tableName}.character_id`)
		.innerJoin(abilities, `${abilities}.id`, `${characters}.passive_id`)
		.whereRaw(`${tableName}.guild_ids::jsonb @> '??'`, [ params.guild_id ])
		.where(`${tableName}.is_deleted`, false);

	if (typeof params.name === "string") {
		query = query.where(`${characters}.name`, "ilike", `%${params.name}%`);
	} else if (typeof params.name === "object") {
		query = query.where(
			`${characters}.name`,
			"~*",
			`(${params.name.join("|")}).*`
		);
	}
	if (typeof params.type === "string") {
		query = query.where(`${characters}.type`, "ilike", `%${params.type}%`);
	} else if (typeof params.type === "object") {
		query = query.where(
			`${characters}.type`,
			"~*",
			`(${params.type.join("|")}).*`
		);
	}
	if (typeof params.abilityname === "string") {
		query = query.where(
			`${abilities}.name`,
			"ilike",
			`%${params.abilityname}%`
		);
	} else if (typeof params.abilityname === "object") {
		query = query.where(
			`${abilities}.name`,
			"~*",
			`(${params.abilityname.join("|")}).*`
		);
	}
	if (typeof params.series === "string") {
		query = query.where(`${tableName}.series`, "ilike", `%${params.series}%`);
	}

	query = query.limit(pagination.limit).offset(pagination.offset);

	return query;
};

export const getRandom = async (
	guild_id: string
): Promise<CustomServerCardProps[]> => {
	const db = connection;
	return db
		.select(cols)
		.from(tableName)
		.whereRaw("guild_ids::jsonb @> '??'", [ guild_id ])
		.where({ is_deleted: false })
		.orderByRaw("random()")
		.limit(1);
};

export const getByCharacterId = async (character_id: number | number[]): Promise<CustomServerCardProps[]> => {
	let query = connection.select(cols).from(tableName);
	if (typeof character_id === "object") {
		query = query.whereIn("character_id", character_id);
	} else {
		query = query.where("character_id", "=", character_id);
	}
	return query;
};
