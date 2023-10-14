import { CreateDarkZoneProfileProps, DarkZoneProfileProps } from "@customTypes/darkZone/profile";
import { RawUpdateProps } from "@customTypes/utility";
import Cache from "cache";
import { CACHE_KEYS } from "helpers/cacheConstants";
import loggers from "loggers";
import { prepareRawUpdateObject } from "utility";
import * as Model from "../models/DarkZoneProfile";

export const createDarkZoneProfile = async (data: CreateDarkZoneProfileProps) => {
	try {
		loggers.info("DarkZoneController.createDarkZoneProfile: creating new profile: ", { data });
		return Model.create(data);
	} catch (err) {
		loggers.error("DarkZoneController.createDarkZoneProfile: ERROR", err);
		return;
	}
};

export const getDarkZoneProfile = async ({ user_tag }: { user_tag: string; }) => {
	try {
		const key = CACHE_KEYS.DARK_ZONE_PROFILE + user_tag;
		return Cache.fetch(key, async () => {
			return Model.get(user_tag);
		}, 60 * 60 * 24);
	} catch (err) {
		loggers.error("DarkZoneController.getDarkZoneProfile: ERROR", err);
		return;
	}
};

/**
 * This method allows you to update row at DB level
 * @param user_tag 
 * @param data 
 * @returns 
 */
export const updateRawDzProfile = async (
	params: { user_tag: string; },
	data: RawUpdateProps<Partial<DarkZoneProfileProps>>
) => {
	try {
		loggers.info("DarkZoneController.updateRawDzProfile: updating with data ", {
			params,
			data
		});
		return Model.rawUpdate(params.user_tag,  prepareRawUpdateObject(data));
	} catch (err) {
		loggers.error("DarkZoneController.updateRawDzProfile: ERROR", err);
		return;
	}
};

/**
 * Updates the rows with the exact values in the object
 * @param user_tag 
 * @param data 
 */
export const updateDzProfile = async (params: { user_tag: string; }, data: Partial<DarkZoneProfileProps>) => {
	try {
		loggers.info("DarkZoneController.updateDzProfile: updating with data", {
			params,
			data
		});
		return Model.update(params.user_tag, data);
	} catch (err) {
		loggers.error("DarkZoneController.updateDzProfile: ERROR", err);
		return;
	}
};