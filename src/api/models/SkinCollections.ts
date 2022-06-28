import { PaginationProps } from "@customTypes/pagination";
import { CreateSkinCollectionProps, ISkinCollection, SkinCollectionProps, SkinProps } from "@customTypes/skins";
import connection from "db";

const tableName = "skin_collections";
const cardSkins = "card_skins";
export const transformation = {
	id: {
		type: "number",
		autoIncrement: true,
	},
	skinId: {
		type: "number",
		columnName: "skin_id"
	},
	userTag: {
		type: "string",
		columnName: "user_tag"
	},
	characterId: {
		type: "number",
		columnName: "character_id"
	},
	isSelected: {
		type: "boolean",
		defaultsTo: false,
		columnName: "is_selected"
	}
};

export const getAll = async (params: { user_tag: string; name: string | string[]; }, pagination: PaginationProps = {
	limit: 10,
	offset: 0
}): Promise<Omit<ISkinCollection, "metadata">[]> => {
	const db = connection;
	let query = db
		.select(db.raw(`${tableName}.*, ${cardSkins}.name, ${cardSkins}.filepath, count(*) over() as total_count`))
		.from(tableName)
		.innerJoin(cardSkins, `${tableName}.skin_id`, `${cardSkins}.id`)
		.where(`${tableName}.user_tag`, params.user_tag);

	if (typeof params.name === "string") {
		query = query.where(`${cardSkins}.name`, "ilike", `%${params.name}%`);
	} else if (typeof params.name === "object") {
		query = query.where(`${cardSkins}.name`, "~", `^(${params.name.join("|")}).*`);
	}

	query = query.limit(pagination.limit).offset(pagination.offset);

	return query;
};

export const get = async (params: { user_tag: string, id: number }): Promise<ISkinCollection[]> => {
	const db = connection;
	const query = db
		.select(db.raw(`${tableName}.*, ${cardSkins}.name, ${cardSkins}.filepath, ${cardSkins}.metadata`))
		.from(tableName)
		.innerJoin(cardSkins, `${tableName}.skin_id`, `${cardSkins}.id`)
		.where(`${tableName}.user_tag`, params.user_tag)
		.where(`${tableName}.id`, params.id);

	return query;
};

export const del = async (params: { id: number }) => {
	return connection(tableName).where(`${tableName}.id`, params.id).del();
};

export const create = async (data: CreateSkinCollectionProps) => {
	return connection(tableName).insert(data);
};