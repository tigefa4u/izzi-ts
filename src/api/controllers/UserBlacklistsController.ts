import { UserBlacklistCreateProps, UserBlacklistUpdateProps } from "@customTypes/userBlacklists";
import loggers from "loggers";
import * as UserBlacklist from "../models/UserBlacklists";

export const getUserBlacklist = async (params: { user_tag: string; }) => {
	try {
		return UserBlacklist.get(params.user_tag);
	} catch (err) {
		loggers.error("api.controllers.getUserBlacklist: ERROR", err);
		return;
	}
};

export const createUserBlacklist = async (data: UserBlacklistCreateProps) => {
	try {
		loggers.info("Creating user blacklist: " + JSON.stringify(data));
		return UserBlacklist.create(data);
	} catch (err) {
		loggers.error("api.controllers.createUserBlacklist: ERROR", err);
		return;
	} 
};

export const updateUserBlacklist = async (params: {user_tag: string;}, data: UserBlacklistUpdateProps) => {
	try {
		loggers.info("Updating user blacklist with data: " + JSON.stringify({
			params,
			data
		}));
		return UserBlacklist.update(params.user_tag, data);
	} catch (err) {
		loggers.error("api.controllers.updateUserBlacklist: ERROR", err);
		return;
	} 
};

export const deleteUserBlacklist = async (params: { user_tag: string; }) => {
	try {
		loggers.info("Deleting user blacklist: " + params.user_tag);
		return UserBlacklist.del(params.user_tag);
	} catch (err) {
		loggers.error("api.controllers.deleteUserBlacklist: ERROR", err);
		return;
	} 
};