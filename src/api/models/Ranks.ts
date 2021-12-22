const tableName = "ranks";
export const transformation = {
	id: {
		type: "number",
		autoIncrement: true,
	},
	rank: { type: "string", },
	maxPower: {
		type: "number",
		columnName: "max_power",
	},
	maxLevel: {
		type: "number",
		columnName: "max_level",
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