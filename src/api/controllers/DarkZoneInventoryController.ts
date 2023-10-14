import { CreateDarkZoneInvProps } from "@customTypes/darkZone/inventory";
import { PageProps } from "@customTypes/pagination";
import loggers from "loggers";
import * as Model from "../models/DarkZoneInventory";

export const getDzInventory = async (params: { user_tag: string; }, filter: PageProps) => {
	try {
		return;
	} catch (err) {
		loggers.error("DarkZoneInventoryController.getDzInventory: ERROR", err);
		return;
	}
};

export const createDzInventory = async (data: CreateDarkZoneInvProps) => {
	try {
		loggers.info("createDzInventory: creating inv with data: ", { data });
		return Model.create(data);
	} catch (err) {
		loggers.error("DarkZoneInventoryController.createDzInventory: ERROR", err);
		return;
	}
};


export const getDzInvById = async (id: number | number[], user_tag?: string) => {
	try {
		return Model.getById(id, user_tag);
	} catch (err) {
		loggers.error("DarkZoneInventoryController.getDzInvById: ERROR", err);
		return;
	}
};
