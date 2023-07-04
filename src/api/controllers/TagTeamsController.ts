import { TagTeamCreateProps } from "@customTypes/teams/tagTeams";
import loggers from "loggers";
import * as TagTeams from "../models/TagTeams";

export const createTagTeams = async (data: TagTeamCreateProps) => {
	try {
		loggers.info("TagTeamsController.createTagTeams: creating with data", { data });
		return TagTeams.create(data);
	} catch (err) {
		loggers.error("TagTeamsController.createTagTeams: ERROR", err);
		return;
	}
};

export const delTagTeam = async (params: { id: number; }) => {
	try {
		loggers.info("Deleting tag team with id: ", params.id);
		return TagTeams.del(params);
	} catch (err) {
		loggers.error("TagTeamsController.delTagTeam: ERROR", err);
		return;
	}
};

export const GetTagTeamPlayer = async (params: { user_tag: string; }) => {
	try {
		loggers.info("Fetching tag team player details for user_tag: ", params.user_tag);
		return TagTeams.getPlayerDetails(params);
	} catch (err) {
		loggers.error("TagTeamsController.getTagTeamPlayer: ERROR", err);
		return;
	}
};

export const updateTagTeamPoints = async (params: { id: number; }, pointsToAdd: number) => {
	try {
		loggers.info("Updating tag team points for team id: ", params.id, { pointsToAdd });
		return TagTeams.updatePoints(params, pointsToAdd);
	} catch (err) {
		loggers.error("TagTeamsController.updateTagTeamPoints: ERROR", err);
		return;
	}
};

export const loseTagTeamPoints = async (params: { id: number; }, pointsToLose: number) => {
	try {
		loggers.info("Losing tag team points for team id: ", params.id, { pointsToLose });
		return TagTeams.losePoints(params, pointsToLose);
	} catch (err) {
		loggers.error("loseTagTeamPoints.updateTagTeamPoints: ERROR", err);
		return;
	}
};