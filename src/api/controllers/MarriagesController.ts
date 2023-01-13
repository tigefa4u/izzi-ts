import { MarriageCreateProps } from "@customTypes/marriages";
import loggers from "loggers";
import * as Marriages from "../models/Marriages";

export const getMarriage = async (params: { user_tag: string }) => {
	try {
		const result = await Marriages.get(params);
		return result[0];
	} catch (err) {
		loggers.error("api.controllers.MarriagesController.getMarriage: ERROR", err);
		return;
	}
};

export const delMarriage = async (params: { user_tag: string }) => {
    	try {
		return Marriages.del(params);
	} catch (err) {
		loggers.error("api.controllers.MarriagesController.delMarriage: ERROR", err);
		return;
	}
};

export const createMarriage = async (data: MarriageCreateProps) => {
    	try {
		return Marriages.create(data);
	} catch (err) {
		loggers.error("api.controllers.MarriagesController.createMarriage: ERROR", err);
		return;
	}
};