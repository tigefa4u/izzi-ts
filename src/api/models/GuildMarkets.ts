const tableName = "guild_markets";
export const transformation = {
	id: {
		type: "number",
		autoIncrement: true,
	},
	name: { type: "string", },
	price: { type: "number", },
	stats: { type: "json", },
	createdAt: {
		columnName: "created_at",
		type: "timestamp",
	},
	updatedAt: {
		columnName: "updated_at",
		type: "timestamp",
	},
};