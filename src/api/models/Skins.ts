import { SkinProps } from "@customTypes/skins";
import connection from "db";

const tableName = "card_skins";
export const transformation = {
	id: {
		type: "number",
		autoIncrement: true,
	},
	name: {
		type: "string",
		required: true,
	},
	filepath: {
		type: "string",
		required: true
	},
	isDifficulty: {
		type: "boolean",
		columnName: "is_difficulty",
		defaultsTo: false
	},
	characterId: {
		type: "number",
		columnName: "character_id",
		required: true
	},
	price: { type: "number" },
	metadata: { type: "json" },
	createdAt: {
		type: "timestamp",
		columnName: "created_at",
	},
	updatedAt: {
		type: "timestamp",
		columnName: "updated_at",
	},
};

export const get = async (params: Partial<Pick<SkinProps, "name" | "id">>): Promise<SkinProps[]> => {
	const db = connection;
	let query = db
		.select("*")
		.from(tableName);

	if (params.id) {
		query = query.where(`${tableName}.id`, params.id);
	} else if (params.name) {
		query = query.where(`${tableName}.name`, "ilike", `%${params.name}%`);
	}

	return query;
};

export const getByCharacterId = async (params: { character_id: number | number[]; }): Promise<SkinProps[]> => {
	if (!params.character_id) return [];
	const db = connection;
	let query = db.select("*")
		.from(tableName);

	if (typeof params.character_id === "object") {
		query = query.whereIn(`${tableName}.character_id`, params.character_id);
	} else {
		query = query.where(`${tableName}.character_id`, "=", params.character_id);
	}

	return query;
};