const tableName = "guilds";
const transformation = {
	id: {
		type: "number",
		autoIncrement: true,
	},
	guildId: {
		type: "number",
		columnName: "guild_id",
	},
	guildName: {
		type: "string",
		columnName: "guild_name",
	},
	guildStats: {
		columnName: "guild_stats",
		type: "json",
	},
	name: { type: "string", },
	prefix: {
		type: "string",
		defaultsTo: "iz",
	},
	gold: {
		type: "number",
		defaultsTo: 0,
	},
	points: {
		type: "number",
		defaultsTo: 0
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