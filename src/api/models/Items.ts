const tableName = "items";
export const transformation = {
	id: {
		type: "number",
		autoIncrement: true,
	},
	name: { type: "string", },
	description: { type: "string", },
	stats: { type: "json", },
	filepath: { type: "string", },
	category: { type: "json", },
	price: { type: "number", },
	createdAt: {
		type: "timestamp",
		columnName: "created_at",
	},
	updatedAt: {
		type: "timestamp",
		columnName: "updated_at",
	},
};