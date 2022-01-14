import { MarriageCreateProps } from "@customTypes/marriages";
import loggers from "loggers";
import * as Marriages from "../models/Marriages";

export const getMarriage = async (params: { user_tag: string }) => {
	try {
		const result = await Marriages.get(params);
		return result[0];
	} catch (err) {
		loggers.error("api.controllers.MarriagesController.getMarriage(): something went wrong", err);
		return;
	}
};

export const delMarriage = async (params: { user_tag: string }) => {
    	try {
		return await Marriages.del(params);
	} catch (err) {
		loggers.error("api.controllers.MarriagesController.delMarriage(): something went wrong", err);
		return;
	}
};

export const createMarriage = async (data: MarriageCreateProps) => {
    	try {
		return await Marriages.create(data);
	} catch (err) {
		loggers.error("api.controllers.MarriagesController.createMarriage(): something went wrong", err);
		return;
	}
};