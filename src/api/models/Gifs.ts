const tableName = "gifs";
export const transformation = {
	id: {
		type: "number",
		autoIncrement: true,
	},
	commandId: {
		type: "number",
		columnName: "command_id",
		ref: "commands"
	},
	url: { type: "json" },
	createdAt: {
		type: "timestamp",
		columnName: "created_at",
	},
	updatedAt: {
		type: "timestamp",
		columnName: "updated_at",
	},
};