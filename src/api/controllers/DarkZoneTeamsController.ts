import { DzTeamCreateProps, DzTeamProps } from "@customTypes/darkZone/teams";
import loggers from "loggers";
import * as Model from "../models/DarkZoneTeams";

export const getDzTeam = async (user_tag: string) => {
	try {
		return Model.get({ user_tag: user_tag });
	} catch (err) {
		loggers.error("DarkZoneTeamsController.getDzTeam: ERROR", err);
		return;
	}
};

export const updateDzTeam = async (user_tag: string, data: Partial<DzTeamProps>) => {
	try {
		return Model.update(user_tag, data);
	} catch (err) {
		loggers.error("DarkZoneTeamsController.updateDzTeam: ERROR", err);
		return;
	}
};

export const createDzTeam = async (data: DzTeamCreateProps) => {
	try {
		return Model.create(data);
	} catch (err) {
		loggers.error("DarkZoneTeamsController.createDzTeam: ERROR", err);
		return;
	}
};
