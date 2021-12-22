const tableName = "guild_members";
export const transformation = {
	id: {
		type: "number",
		autoIncrement: true,
	},
	guildId: {
		columnName: "guild_id",
		type: "number",
		ref: "guilds",
	},
	userId: {
		columnName: "user_id",
		type: "number",
		ref: "users",
	},
	isLeader: {
		columnName: "is_leader",
		type: "boolean",
		defaultsTo: false,
	},
	isViceLeader: {
		columnName: "is_vice_leader",
		type: "boolean",
		defaultsTo: false,
	},
	isWarhead: {
		type: "boolean",
		defaultsTo: false,
		columnName: "is_warhead"
	},
	isInWar: {
		type: "boolean",
		defaultsTo: false,
		columnName: "is_in_war"
	},
	createdAt: {
		columnName: "created_at",
		type: "timestamp",
	},
	updatedAt: {
		columnName: "updated_at",
		type: "timestamp",
	},
};