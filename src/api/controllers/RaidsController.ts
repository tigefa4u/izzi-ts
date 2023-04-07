import { FilterProps, ResponseWithPagination } from "@customTypes";
import { PageProps } from "@customTypes/pagination";
import { RaidProps, RaidUpdateProps, RaidCreateProps, RaidLobbyProps } from "@customTypes/raids";
import { paginationForResult, paginationParams } from "helpers/pagination";
import loggers from "loggers";
import * as Raids from "../models/Raids";

export const createRaid = async (data: RaidCreateProps) => {
	try {
		loggers.info("Creating Raid boss: ", data);
		return Raids.create(data);
	} catch (err) {
		loggers.error(
			"api.controllers.RaidsController.createRaid: ERROR",
			err
		);
		return;
	}
};

export const updateRaid = async (params: { id: number; }, data: RaidUpdateProps) => {
	try {
		loggers.info("Updating raid", {
			params,
			data
		});
		return Raids.update(params, data);
	} catch (err) {
		loggers.error(
			"api.controllers.RaidsController.updateRaid: ERROR",
			err
		);
		return;
	}
};

export const updateRaidEnergy = async (params: { id: number; }, data: RaidLobbyProps) => {
	try {
		loggers.info("Refilling raid energy: ", {
			params,
			data
		});
		return Raids.refillEnergy({
			id: params.id,
			data 
		});
	} catch (err) {
		loggers.error(
			"api.controllers.RaidsController.updateRaidEnergy: ERROR",
			err
		);
		return;
	}
};

export const updateLobby = async ({ raid_id, user_id, data }: {
    raid_id: number;
    user_id: number;
    data: RaidLobbyProps[0];
}) => {
	try {
		loggers.info("Updating raid lobby: ", {
			raid_id,
			user_id,
			data
		});
		return Raids.updateLobby({
			raid_id,
			user_id,
			data
		});
	} catch (err) {
		loggers.error(
			"api.controllers.RaidsController.updateLobby: ERROR",
			err
		);
		return;
	}
};

export const getRaid = async (params: { id: number }) => {
	try {
		const result = await Raids.get(params);
		return result[0];
	} catch (err) {
		loggers.error(
			"api.controllers.RaidsController.getRaid: ERROR",
			err
		);
		return;
	}
};

export const deleteRaid = async (params: { id: number | number[]; }) => {
	try {
		loggers.info("Deleting Raid: " + params.id);
		return Raids.destroy(params);
	} catch (err) {
		loggers.error(
			"api.controllers.RaidsController.deleteRaid: ERROR",
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
			"api.controllers.RaidsController.getAllRaids: ERROR",
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
			"api.controllers.RaidsController.getUserRaidLobby: ERROR",
			err
		);
		return;
	}
};

export const getAllRaids = async (params?: Partial<RaidProps>) => {
	try {
		const result = await Raids.getAll(params);
		return result;
	} catch (err) {
		loggers.error(
			"api.controllers.RaidsController.getAllRaids: ERROR",
			err
		);
		return;
	}	
};