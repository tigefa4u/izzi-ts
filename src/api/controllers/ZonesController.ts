import { ResponseWithPagination } from "@customTypes";
import { PageProps } from "@customTypes/pagination";
import { ZoneProps } from "@customTypes/zones";
import Cache from "cache";
import { paginationForResult, paginationParams } from "helpers/pagination";
import loggers from "loggers";
import * as Zones from "../models/Zones";
import * as ZoneBackup from "../models/ZoneBackup";

export const getZoneByLocationId = async (params: { location_id: number }) => {
	try {
		const key = `zone::${params.location_id}`;
		const result = await Cache.fetch(key, async () => {
			const res = await Zones.get(params);
			return res;
		});

		return result;
	} catch (err) {
		loggers.error(
			"api.controllers.ZonesController.getZoneByLocationId(): something went wrong",
			err
		);
		return;
	}
};

export const getAllZones = async (
	params = {},
	filter: PageProps
): Promise<ResponseWithPagination<ZoneProps[]> | undefined> => {
	try {
		const result = await Zones.getAll(await paginationParams(filter));
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
			"api.controllers.ZonesController.getAllZones(): something went wrong",
			err
		);
		return;
	}
};

export const createOrUpdateZoneBackup = async (data: { user_tag: string; max_ruin: number; max_floor: number; }) => {
	try {
		loggers.info("Creating Zone Backup: " + JSON.stringify(data));
		return await ZoneBackup.createOrUpdate(data);
	} catch (err) {
		loggers.error(
			"api.controllers.ZonesController.createOrUpdateZoneBackup(): something went wrong",
			err
		);
		return;
	}	
};

export const getMaxLocation = async () => {
	try {
		return await Cache.fetch("max::location", async () => {
			const result = await Zones.getMaxLocation();
			return result.max;
		});
	} catch (err) {
		loggers.error(
			"api.controllers.ZonesController.createOrUpdateZoneBackup(): something went wrong",
			err
		);
		return;
	}	
};