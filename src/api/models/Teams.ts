const tableName = "teams";
export const transformation = {
	id: {
		type: "integer",
		autoIncrements: true,
	},
	userId: {
		type: "integer",
		columnName: "user_id",
		ref: "users"
	},
	name: { type: "string", },
	metadata: { type: "json", },
	createdAt: {
		type: "timestamp",
		columnName: "created_at",
	},
	updatedAt: {
		type: "timestamp",
		columnName: "updated_at",
	},
};