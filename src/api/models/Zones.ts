import connection from "db";

const tableName = "ruins";
export const transformation = {
	id: {
		type: "number",
		autoIncrement: true,
	},
	locationId: {
		type: "number",
		default: 1,
		columnName: "location_id",
	},
	maxFloor: {
		type: "number",
		required: true,
		columnName: "max_floor",
	},
	filepath: { type: "string", },
	series: { type: "string", },
	name: { type: "string", },
	description: { type: "string", },
	createdAt: {
		type: "timestamp",
		columnName: "created_at",
	},
	updatedAt: {
		type: "timestamp",
		columnName: "updated_at",
	},
};
