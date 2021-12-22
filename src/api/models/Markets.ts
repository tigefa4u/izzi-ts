const tableName = "markets";
export const transformation = {
	id: {
		type: "number",
		autoIncrement: true,
	},
	userId: {
		type: "number",
		required: true,
		columnName: "user_id",
		ref: "users",
	},
	price: {
		type: "number",
		default: 1000,
	},
	collectionId: {
		type: "number",
		required: true,
		columnName: "collection_id",
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