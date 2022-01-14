import { GuildCreateProps, GuildParams, GuildUpdateProps } from "@customTypes/guilds";
import loggers from "loggers";
import * as Guilds from "../models/Guilds";

export const getGuild = async (params: GuildParams) => {
	try {
		const result = await Guilds.get(params);
		return result[0];
	} catch (err) {
		loggers.error("api.controllers.GuildsController.getGuild(): something went wrong", err);
		return;
	}
};

export const updateGuild = async (params: GuildParams, data: GuildUpdateProps) => {
	try {
		return await Guilds.update(params, data);
	} catch (err) {
		loggers.error("api.controllers.GuildsController.updateGuild(): something went wrong", err);
		return;
	}
};

export const deleGuild = async (params: { id: number }) => {
	try {
		return await Guilds.del(params);
	} catch (err) {
		loggers.error("api.controllers.GuildsController.delGuild(): something went wrong", err);
		return;
	}
};

export const createGuild = async (data: GuildCreateProps) => {
	try {
		loggers.info("Creating new Guild with: " + JSON.stringify(data));
		return await Guilds.create(data);
	} catch (err) {
		loggers.error("api.controllers.GuildsController.createGuild(): something went wrong", err);
		return;
	}
};

export const getGuildDetails = async (params: { id: number }) => {
	try {
		return await Guilds.getDetails(params);
	} catch (err) {
		loggers.error("api.controllers.GuildsController.getGuildDetails(): something went wrong", err);
		return;
	}
};

export const getTotalMemberAndItemCount = async (params: { id: number }) => {
	try {
		return await Guilds.getMemberAndItemCount(params);
	} catch (err) {
		loggers.error("api.controllers.GuildsController.getTotalMemberAndItemCount(): something went wrong", err);
		return;
	}
};