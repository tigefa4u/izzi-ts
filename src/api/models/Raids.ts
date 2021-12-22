const tableName = "raids";
export const transformation = {
	id: {
		type: "integer",
		autoIncrements: true,
	},
	characterRank: {
		type: "string",
		columnName: "character_rank",
	},
	characterId: {
		columnName: "character_id",
		ref: "characters",
		type: "integer",
	},
	characterLevel: {
		columnName: "character_level",
		type: "integer",
	},
	lobby: { type: "json", },
	loot: { type: "json", },
	isStart: {
		type: "boolean",
		columnName: "is_start",
		default: false,
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