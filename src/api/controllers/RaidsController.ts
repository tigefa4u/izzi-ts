import { FilterProps, ResponseWithPagination } from "@customTypes";
import { PageProps } from "@customTypes/pagination";
import { RaidProps, RaidUpdateProps, RaidCreateProps } from "@customTypes/raids";
import { paginationForResult, paginationParams } from "helpers/pagination";
import loggers from "loggers";
import * as Raids from "../models/Raids";

export const createRaid = async (data: RaidCreateProps) => {
	try {
		return await Raids.create(data);
	} catch (err) {
		loggers.error(
			"api.controllers.RaidsController.createRaid(): something went wrong",
			err
		);
		return;
	}
};

export const updateRaid = async (params: { id: number }, data: RaidUpdateProps) => {
	try {
		return await Raids.update(params, data);
	} catch (err) {
		loggers.error(
			"api.controllers.RaidsController.updateRaid(): something went wrong",
			err
		);
		return;
	}
};

export const updateLobby = async ({ raid_id, index, data }: {
    raid_id: number;
    index: number;
    data: RaidUpdateProps;
}) => {
	try {
		return await Raids.updateLobby({
			raid_id,
			index,
			data
		});
	} catch (err) {
		loggers.error(
			"api.controllers.RaidsController.updateLobby(): something went wrong",
			err
		);
		return;
	}
};

export const getRaid = async (params: { id: number }) => {
	try {
		return await Raids.get(params);
	} catch (err) {
		loggers.error(
			"api.controllers.RaidsController.getRaid(): something went wrong",
			err
		);
		return;
	}
};

export const deleteRaid = async (params: { id: number }) => {
	try {
		return await Raids.destroy(params);
	} catch (err) {
		loggers.error(
			"api.controllers.RaidsController.deleteRaid(): something went wrong",
			err
		);
		return;
	}
};

export const getRaidLobbies = async (
	params: FilterProps,
	filter: PageProps
): Promise<ResponseWithPagination<RaidProps[]> | undefined> => {
	try {
		const result = await Raids.getRaids(params, await paginationParams(filter));

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
			"api.controllers.RaidsController.getAllRaids(): something went wrong",
			err
		);
		return;
	}
};

export const getUserRaidLobby = async (params: { user_id: number }) => {
	try {
		const result = await Raids.getRaidLobby(params);
		return result[0];
	} catch (err) {
		loggers.error(
			"api.controllers.RaidsController.getUserRaidLobby(): something went wrong",
			err
		);
		return;
	}
};