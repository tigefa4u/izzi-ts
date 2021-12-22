const tableName = "crates";

export const transformation = {
	id: {
		type: "number",
		autoIncrement: true,
	},
	category: {
		type: "string",
		isIn: [ "silver", "legendary", "premium" ],
	},
	userTag: {
		type: "string",
		columnName: "user_tag",
	},
	price: {
		type: "number",
		defaultsTo: 0,
	},
	contents: { type: "json", },
	isOnMarket: {
		type: "boolean",
		defaultsTo: false,
		columnName: "is_on_market",
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