import { TagTeamCreateProps, TagTeamProps, TagTeamUpdateProps } from "@customTypes/teams/tagTeams";
import connection from "db";

const tableName = "tag_teams";
export const transformation = {
	id: {
		type: "integer",
		autoIncrements: true,
	},
	players: { type: "jsonb", },
	points: { type: "number" },
	metadata: { type: "json", },
	createdAt: {
		type: "timestamp",
		columnName: "created_at",
	},
	updatedAt: {
		type: "timestamp",
		columnName: "updated_at",
	},
};

//
// Tag Teams is a handicap where players can team up
// allowing their teammate to attack for the player in raids 
// if both parties are in the same raid.
//
// More features may be added in the future (Dark zone)
//
export const get = async (params: { id?: number; name?: string; }): Promise<TagTeamProps[]> => {
	return connection(tableName).where(params);
};

export const update = async (params: { id?: number; name?: string; }, data: TagTeamUpdateProps) => {
	return connection(tableName).where(params).update(data);
};

export const create = async (data: TagTeamCreateProps) => {
	return connection(tableName).insert(data);
};

export const del = async (params: { id: number; }) => {
	return connection(tableName).where(params).del();
};

export const getPlayerDetails = async (params: {
    user_tag: string;
  }): Promise<TagTeamProps> => {
	const db = connection;
	const query = db
		.select(
			db.raw(`${tableName}.*, players->'${params.user_tag}' as player`)
		)
		.from(tableName)
		.whereRaw(
			`(${tableName}.players->'${params.user_tag}'->>'user_tag') = '${params.user_tag}'`
		).then((res) => res[0]);

	return query;
};

export const updatePoints = async (params: { id: number; }, pointsToAdd: number) => {
	const db = connection;
	return connection(tableName).where(params).update({ points: db.raw(`points + ${pointsToAdd}`) });
};

export const losePoints = async (params: { id: number; }, pointsToLose: number) => {
	const db = connection;
	return connection(tableName).where(params).update({ points: db.raw(`points - ${pointsToLose}`) });
};