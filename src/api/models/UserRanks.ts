const tableName = "user_ranks";
export const transformation = {
	id: {
		type: "number",
		autoIncrements: true
	},
	userTag: {
		type: "text",
		columnName: "user_tag"
	},
	wins: { type: "number" },
	losses: { type: "number" },
	division: { type: "number" },
	exp: { type: "number" },
	rExp: {
		type: "number",
		columnName: "r_exp"
	},
	rankId: {
		type: "number",
		columnName: "rank_id"
	},
	rank: { type: "text" }
};