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
	createdAt: {
		type: "timestamp",
		columnName: "created_at",
	},
	updatedAt: {
		type: "timestamp",
		columnName: "updated_at",
	},
};