const tableName = "skin_collections";
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