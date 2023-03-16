const tableName = "user_economy_transaction_logs";

export const transformation = {
	id: { type: "number" },
	userTag: {
		type: "string",
		columnName: "user_tag"
	},
	username: { type: "string" },
	izziPoints: {
		type: "number",
		columnName: "izzi_points"
	},
	shards: { type: "number" },
	isDeleted: {
		type: "boolean",
		columnName: "is_deleted",
		defaultsTo: false
	}
};