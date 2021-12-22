import { FilterProps } from "@customTypes";
import {
	CharacterDetailsProps,
	CharactersReturnType,
} from "@customTypes/characters";
import connection from "db";

const tableName = "characters";
const abilities = "passives";
export const transformation = {
	id: {
		type: "number",
		autoIncrement: true,
	},
	name: {
		type: "string",
		required: true,
	},
	stats: {
		type: "json",
		required: true,
	},
	passiveId: {
		type: "number",
		ref: "passives",
		columnName: "passive_id",
	},
	type: { type: "string" },
	createdAt: {
		type: "timestamp",
		columnName: "created_at",
	},
	updatedAt: {
		type: "timestamp",
		columnName: "updated_at",
	},
};
export const getCharacterById: (params: {
  id: string;
}) => Promise<CharacterDetailsProps> = async function (params) {
	const db = connection;
	const query = db
		.select(
			db.raw(`${tableName}.id, ${tableName}.name, ${tableName}.type, ${tableName}.stats,
        ${abilities}.name as abilityname, ${abilities}.description as abilitydescription`)
		)
		.from(tableName)
		.innerJoin(abilities, `${tableName}.passive_id`, `${abilities}.id`)
		.where("id", params.id)
		.then((res) => res[0]);

	return query;
};
export const getCharacters: (
  params: FilterProps,
) => Promise<CharactersReturnType> = async function (
	params,
) {
	const db = connection;
	let query = db
		.select(
			db.raw(`${tableName}.id, ${tableName}.name, ${tableName}.type, ${tableName}.stats,
        ${abilities}.name as abilityname, ${abilities}.description as abilitydescription`)
		)
		.from(tableName)
		.innerJoin(abilities, `${tableName}.passive_id`, `${abilities}.id`);

	if (typeof params.name === "string") {
		query = query.where(`${tableName}.name`, "ilike", `%${params.name}%`);
	} else if (typeof params.name === "object") {
		query = query.where(`${tableName}.name`, "~", `^(${params.name.join("|")}).*`);
	}
	if (typeof params.type === "string") {
		query = query.where(`${tableName}.type`, "ilike", `%${params.type}%`);
	} else if (typeof params.type === "object") {
		query = query.where(`${tableName}.type`, "~", `^(${params.type.join("|")}).*`);
	}
	if (typeof params.abilityname === "string") {
		query = query.where(`${abilities}.name`, "ilike", `%${params.abilityname}%`);
	} else if (typeof params.abilityname === "object") {
		query = query.where(`${abilities}.name`, "~", `^(${params.abilityname.join("|")}).*`);
	}

	return query;
};
