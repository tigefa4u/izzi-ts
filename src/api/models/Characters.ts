import { FilterProps } from "@customTypes";
import {
	CharacterDetailsProps,
	CharactersReturnType,
} from "@customTypes/characters";
import { PaginationProps } from "@customTypes/pagination";
import connection from "db";
import emoji from "emojis/emoji";

const tableName = "characters";
const abilities = "passives";
const cards = "cards";
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
	isDarkZone: {
		type: "boolean",
		columnName: "is_dark_zone"
	},
};

export const getCharacterById: (params: {
  id: number;
}) => Promise<CharacterDetailsProps> = async function (params) {
	const db = connection;
	const query = db
		.select(
			db.raw(`${tableName}.id, ${tableName}.name, ${tableName}.type, ${tableName}.stats,
        ${abilities}.name as abilityname, ${abilities}.description as abilitydescription`)
		)
		.from(tableName)
		.innerJoin(abilities, `${tableName}.passive_id`, `${abilities}.id`)
		.where(`${tableName}.id`, params.id)
		.then((res) => res[0]);

	return query;
};

export const get: (
  params: FilterProps & { isExactMatch?: boolean; },
) => Promise<CharactersReturnType> = async function (
	params,
) {
	const db = connection;
	let query = db
		.select(
			db.raw(`${tableName}.id, ${tableName}.name, ${tableName}.type, ${tableName}.stats,
        ${abilities}.name as abilityname, ${abilities}.description as abilitydescription, ${abilities}.is_passive`)
		)
		.from(tableName)
		.innerJoin(abilities, `${tableName}.passive_id`, `${abilities}.id`);

	if (params.series) {
		query = query.innerJoin(cards, `${cards}.character_id`, `${tableName}.id`)
			.where(`${cards}.series`, "ilike", `%${params.series}%`);
	}

	if (typeof params.name === "string") {
		if (params.isExactMatch) {
			query = query.where(`${tableName}.name`, "=", params.name);
		} else {
			query = query.where(`${tableName}.name`, "ilike", `%${params.name}%`);
		}
	} else if (typeof params.name === "object") {
		if (params.isExactMatch) {
			if (params.name.includes("herta kuru kuru")) {
				params.name = [ `herta kuru kuru ${emoji.hertakurukuru}` ];
			}
			query = query.whereIn(`${tableName}.name`, params.name);
		} else {
			query = query.where(`${tableName}.name`, "~*", `(${params.name.join("|")}).*`);
		}
	}
	if (typeof params.type === "string") {
		query = query.where(`${tableName}.type`, "ilike", `%${params.type}%`);
	} else if (typeof params.type === "object") {
		query = query.where(`${tableName}.type`, "~*", `(${params.type.join("|")}).*`);
	}
	if (typeof params.abilityname === "string") {
		query = query.where(`${abilities}.name`, "ilike", `%${params.abilityname}%`);
	} else if (typeof params.abilityname === "object") {
		query = query.where(`${abilities}.name`, "~*", `(${params.abilityname.join("|")}).*`);
	}
	if (params.ids && params.ids.length > 0) {
		query = query.whereIn(`${tableName}.id`, params.ids);
	}

	return query;
};

export const getCharactersForDex: (
	filter: Pick<FilterProps, "ids" | "abilityname" | "type" | "year" | "name">,
	pagination: PaginationProps
) => Promise<CharacterDetailsProps[]> = async function(filter, pagination = {
	limit: 10,
	offset: 0 
}) {
	const db = connection;
	const alias = "dexalias";
	let query = db
		.select(
			db.raw(`${tableName}.id, ${tableName}.name, ${tableName}.type, ${tableName}.stats,
        	${abilities}.name as abilityname, ${abilities}.description as abilitydescription`)
		)
		.from(tableName)
		.innerJoin(abilities, `${tableName}.passive_id`, `${abilities}.id`)
		.as(alias);
	if (filter.ids && filter.ids.length > 0) {
		query = query.whereIn(`${tableName}.id`, filter.ids);
	}
	if (typeof filter.abilityname === "string") {
		query = query.where(`${abilities}.name`, "ilike", `%${filter.abilityname}%`);
	} else if (typeof filter.abilityname === "object") {
		query = query.where(`${abilities}.name`, "~*", `(${filter.abilityname.join("|")}).*`);
	}
	if (typeof filter.name === "string") {
		query = query.where(`${tableName}.name`, "ilike", `%${filter.name}%`);
	} else if (typeof filter.name === "object") {
		query = query.where(`${tableName}.name`, "~*", `(${filter.name.join("|")}).*`);
	}
	if (typeof filter.type === "string") {
		query = query.where(`${tableName}.type`, "ilike", `%${filter.type}%`);
	} else if (typeof filter.type === "object") {
		query = query.where(`${tableName}.type`, "~*", `(${filter.type.join("|")}).*`);
	}
	if (filter.year) {
		query = query.whereRaw(`EXTRACT(YEAR from ${tableName}.created_at) = ?`, [ filter.year ]);
	}
	query = db.select(db.raw(`${alias}.*, count(*) over() as total_count`))
		.from(query);

	query = query.limit(pagination.limit).offset(pagination.offset);

	return query;
};

export const updateName = (id: number, name: string) => {
	return connection(tableName).where({ id }).update({ name });
};