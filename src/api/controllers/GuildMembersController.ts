import { ResponseWithPagination } from "@customTypes";
import { GuildMemberResponseProps, GuildMemberUpdateProps, GuildMemberCreateProps } from "@customTypes/guildMembers";
import { PageProps } from "@customTypes/pagination";
import { paginationForResult, paginationParams } from "helpers/pagination";
import loggers from "loggers";
import * as GuildMembers from "../models/GuildMembers";

export const getGuildMember = async (params: { user_id: number }) => {
	try {
		const result = await GuildMembers.get(params);
		return result[0];
	} catch (err) {
		loggers.error(
			"api.controllers.GuildMembersController.getGuildMember: ERROR",
			err
		);
		return;
	}
};

export const getAllGuildMembers = async (
	params: { guild_id: number },
	filter: PageProps
): Promise<ResponseWithPagination<GuildMemberResponseProps[]> | undefined> => {
	try {
		const result = await GuildMembers.getAll(
			params,
			await paginationParams(filter)
		);
		const pagination = await paginationForResult({
			data: result,
			query: filter,
		});
		return {
			data: result,
			metadata: pagination,
		};
	} catch (err) {
		loggers.error(
			"api.controllers.GuildMembersController.getAllGuildMembers: ERROR",
			err
		);
		return;
	}
};

export const updateGuildMember = async (params: { id?: number; user_id?: number }, data: GuildMemberUpdateProps) => {
	try {
		loggers.info("Updating Guild Member with: " + JSON.stringify(data));
		return await GuildMembers.update(params, data);
	} catch (err) {
		loggers.error("api.controller.GuildMembersController.updateGuildMember: ERROR", err);
		return;
	}
};

export const delGuildMember = async (params: { id: number }) => {
	try {
		loggers.info("Deleting Guild Member with: " + JSON.stringify(params));
		return await GuildMembers.del(params);
	} catch (err) {
		loggers.error("api.controller.GuildMembersController.delGuildMember: ERROR", err);
		return;
	}
};

export const delAllGuildMembers = async (params: { guild_id: number }) => {
	try {
		loggers.info("Deleting All Guild Members with: " + JSON.stringify(params));
		return await GuildMembers.del(params);
	} catch (err) {
		loggers.error("api.controller.GuildMembersController.delAllGuildMembers: ERROR", err);
		return;
	}
};

export const createGuildMember = async (data: GuildMemberCreateProps | GuildMemberCreateProps[]) => {
	try {
		loggers.info("Creating Guild Member with: " + JSON.stringify(data));
		return await GuildMembers.create(data);
	} catch (err) {
		loggers.error("api.controller.GuildMembersController.createGuildMember: ERROR", err);
		return;
	}
};