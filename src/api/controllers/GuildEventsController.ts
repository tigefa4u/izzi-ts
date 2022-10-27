import { GuildEventsCreateProps, GuildEventsUpdateProps } from "@customTypes/guildEvents";
import loggers from "loggers";
import * as GuildEvents from "../models/GuildEvents";

export const getAllGuildEvents = async (guild_id: string) => {
	try {
		return GuildEvents.get(guild_id);
	} catch (err) {
		loggers.error("api.controllers.GuildEventsController.getAllGuildEvents: ERROR", err);
		return;
	}
};

export const getGuildEventByName = async ({ guild_id, name }: { guild_id: string; name: string; }) => {
	try {
		return GuildEvents.getByName({
			guild_id,
			name 
		});
	} catch (err) {
		loggers.error("api.controllers.GuildEventsController.getAllGuildEvents: ERROR", err);
		return;
	}
};

export const updateGuildEvent = async (params: { guild_id: string; id?: number; }, data: GuildEventsUpdateProps) => {
	try {
		return GuildEvents.update(params, data);
	} catch (err) {
		loggers.error("api.controllers.GuildEventsController.updateGuildEvent: ERROR", err);
		return;
	}
};

export const createGuildEvent = async (data: GuildEventsCreateProps) => {
	try {
		return GuildEvents.create(data);
	} catch (err) {
		loggers.error("api.controllers.GuildEventsController.createGuildEvent: ERROR", err);
		return;
	}
};

export const deleteRaidPing = async (guild_id: string) => {
	try {
		return GuildEvents.delRaidPing(guild_id);
	} catch (err) {
		loggers.error("api.controllers.GuildEventsController.deleteRaidPing: ERROR", err);
		return;
	}
};