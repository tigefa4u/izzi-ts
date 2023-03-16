import { PaginationProps } from "@customTypes/pagination";
import {
	QuestCreateProps,
	QuestParams,
	QuestProps,
	QuestUpdateProps,
} from "@customTypes/quests";
import connection from "db";

const tableName = "quests";

export const transformation = {
	id: { type: "number" },
	name: { type: "string" },
	description: { type: "string" },
	difficulty: {
		type: "string",
		enum: [ "EASY", "MEDIUM", "HARD" ],
	},
	reward: { type: "jsonb" },
	minLevel: {
		type: "number",
		columnName: "min_level",
	},
	maxLevel: {
		type: "number",
		columnName: "max_level",
	},
	isDaily: {
		type: "boolean",
		columnName: "is_daily",
		defaultsTo: false,
	},
	isSpecial: {
		type: "boolean",
		columnName: "is_special",
		defaultsTo: false,
	},
	parentId: {
		type: "boolean",
		columnName: "parent_id",
		ref: "quests.id",
	},
	metadata: { type: "jsonb" },
	criteria: { type: "jsonb" },
	isDeleted: {
		type: "boolean",
		columnName: "is_deleted",
		defaultsTo: false,
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

export const getByid = async (params: QuestParams): Promise<QuestProps[]> => {
	const db = connection;
	let query = db
		.select(
			"id",
			"name",
			"description",
			"difficulty",
			"reward",
			"min_level",
			"max_level",
			"is_daily",
			"is_special",
			"parent_id",
			"metadata",
			"type",
			"criteria"
		)
		.from(tableName)
		.orderBy("created_at", "desc")
		.where({ is_deleted: false });

	if (typeof params.id === "number") {
		query = query.where("id", "=", params.id);
	} else if (typeof params.id === "object") {
		query = query.whereIn("id", params.id);
	}
	if (typeof params.parent_id === "number") {
		query = query.where("parent_id", "=", params.parent_id);
	} else if (typeof params.parent_id === "object") {
		query = query.whereIn("parent_id", params.parent_id);
	}

	return query;
};

export const getByUserLevel = async (
	params: { level: number },
	pagination: PaginationProps = {
		limit: 10,
		offset: 0,
	}
): Promise<QuestProps[]> => {
	const db = connection;
	const query = db
		.select(
			db.raw(`id,
        name,
        description,
        difficulty,
        reward,
        min_level,
        max_level,
        is_daily,
        is_special,
        parent_id,
        type,
        criteria,
        metadata, count(1) over() as total_count`)
		)
		.from(tableName)
		.where({ is_deleted: false })
		.where("min_level", "<=", params.level)
		.andWhere("max_level", ">=", params.level)
		.limit(pagination.limit)
		.offset(pagination.offset);

	return query;
};

export const create = async (data: QuestCreateProps) => {
	return connection(tableName).insert(data);
};

export const update = async (params: QuestParams, data: QuestUpdateProps) => {
	const db = connection;
	if (!params.id && !params.parent_id) return;
	let query = db(tableName).update(data);
	if (typeof params.id === "number") {
		query = query.where("id", "=", params.id);
	} else if (typeof params.id === "object") {
		query = query.whereIn("id", params.id);
	}
	if (typeof params.parent_id === "number") {
		query = query.where("parent_id", "=", params.parent_id);
	} else if (typeof params.parent_id === "object") {
		query = query.whereIn("parent_id", params.parent_id);
	}

	return query;
};

export const getByType = async (params: { type: string; level: number; }): Promise<QuestProps[]> => {
	const db = connection;
	return db(tableName).where({
		type: params.type,
		is_deleted: false 
	})
		.where("min_level", "<=", params.level)
		.where("max_level", ">=", params.level);
};