const tableName = "guild_items";
export const transformation = {
	id: {
		type: "number",
		autoIncrement: true,
	},
	itemId: {
		columnName: "item_id",
		type: "number",
		ref: "guild_markets",
	},
	quantity: { type: "number", },
	createdAt: {
		columnName: "created_at",
		type: "timestamp",
	},
	updatedAt: {
		columnName: "updated_at",
		type: "timestamp",
	},
};