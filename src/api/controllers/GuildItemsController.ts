import { ResponseWithPagination } from "@customTypes";
import {
	GuildItemCreateProps,
	GuildItemParams,
	GuildItemResponseProps,
} from "@customTypes/guildItems";
import { PageProps } from "@customTypes/pagination";
import { paginationForResult, paginationParams } from "helpers/pagination";
import loggers from "loggers";
import * as GuildItems from "../models/GuildItems";

export const delGuildItems = async (params: {
  guild_id: number;
  id?: number;
}) => {
	try {
		loggers.info("Deleting guild items with: " + JSON.stringify(params));
		return await GuildItems.del(params);
	} catch (err) {
		loggers.error(
			"api.controllers.GuildItemsController.delGuildItems: ERROR",
			err
		);
		return;
	}
};

export const createGuildItem = async (data: GuildItemCreateProps) => {
	try {
		return GuildItems.create(data);
	} catch (err) {
		loggers.error(
			"api.controllers.GuildItemsController.createGuildItem: ERROR",
			err
		);
		return;
	}
};

export const updateGuildItem = async (
	params: { id: number },
	data: { quantity: number }
) => {
	try {
		return GuildItems.update(params, data);
	} catch (err) {
		loggers.error(
			"api.controllers.GuildItemsController.updateGuildItem: ERROR",
			err
		);
		return;
	}
};

export const getAllGuildItems = async (
	params: GuildItemParams,
	filter: PageProps
): Promise<ResponseWithPagination<GuildItemResponseProps[]> | undefined> => {
	try {
		const result = await GuildItems.getAll(
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
			"api.controllers.GuildItemsController.getAllGuildItems: ERROR",
			err
		);
		return;
	}
};

export const getGuildItem = async (params: GuildItemParams) => {
	try {
		const result = await GuildItems.get(params);
		return result[0];
	} catch (err) {
		loggers.error(
			"api.controllers.GuildItemsController.getGuildItem: ERROR",
			err
		);
		return;
	}
};
