import connection from "db";

export const tableName = "monthly_cards";
const cards = "cards";
export const transformation = {
	id: { type: "number" },
	characterId: {
		type: "number",
		columnName: "character_id",
	},
	name: { type: "string" },
	isActive: {
		type: "boolean",
		columnName: "is_active",
	},
	isDeleted: {
		type: "boolean",
		columnName: "is_deleted",
	},
	metadata: { type: "jsonb" },
	// timestamps
};

export const get = async () => {
	return connection
		.select(
			connection.raw(`${tableName}.character_id, ${tableName}.id, 
            ${tableName}.name, ${cards}.metadata, ${cards}.series`)
		)
		.from(tableName)
		.leftJoin(cards, `${cards}.character_id`, `${tableName}.character_id`)
		.where(`${cards}.rank`, "=", "immortal")
		.where(`${tableName}.is_active`, true);
};
