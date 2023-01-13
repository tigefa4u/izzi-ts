import { TeamCreateProps, TeamUpdateData, TeamUpdateParams } from "@customTypes/teams";
import loggers from "loggers";
import * as Teams from "../models/Teams";

export const getAllTeams = async (params: { user_id: number; name?: string; }) => {
	try {
		return Teams.get(params);
	} catch (err) {
		loggers.error("api.controllers.TeamsController.getAllTeams: ERROR", err);
		return;
	}
};

export const updateTeam = async (params: TeamUpdateParams, data: Partial<TeamUpdateData>) => {
	try {
		return Teams.update(params, data);
	} catch (err) {
		loggers.error("api.controllers.TeamsController.updateTeam: ERROR", err);
		return;
	}
};

export const createTeam = async (data: TeamCreateProps) => {
	try {
		return Teams.create(data);
	} catch (err) {
		loggers.error("api.controllers.TeamsController.createTeam: ERROR", err);
		return;
	}
};

export const deleteTeam = async (params: TeamUpdateParams) => {
	try {
		return Teams.del(params);
	} catch (err) {
		loggers.error("api.controllers.TeamsController.deleteTeam: ERROR", err);
		return;
	}
};

export const getTeamById = async (params: { user_id: number; id: number }) => {
	try {
		const result = await Teams.get(params);
		return result[0];
	} catch (err) {
		loggers.error("api.controllers.TeamsController.getTeamById: ERROR", err);
		return;
	}
};