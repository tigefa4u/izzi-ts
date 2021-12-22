const tableName = "marriages";
export const transformation = {
	id: {
		type: "number",
		autoIncrement: true,
	},
	userTag: {
		type: "string",
		columnName: "user_tag",
	},
	marriedTo: {
		type: "string",
		columnName: "married_to",
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