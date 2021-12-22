const tableName = "redirect_drops";
export const transformation = {
	id: {
		type: "number",
		autoIncrement: true
	},
	channels: { type: "jsonb" },
	guildId: {
		columnName: "guild_id",
		type: "string"
	}
};