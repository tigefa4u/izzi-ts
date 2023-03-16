import { StreakCreateProps, StreakUpdateProps } from "@customTypes/streaks";
import loggers from "loggers";
import * as Streaks from "../models/Streaks";

export const getUserStreaks = async (params: { user_tag: string; }) => {
	try {
		loggers.info(`StreaksController.getUserStreaks: fetching data for uid: ${params.user_tag}`);
		return Streaks.get({ user_tag: params.user_tag });
	} catch (err) {
		loggers.error("api.StreaksController.getUserStreaks: ERROR", err);
		return;
	}
};

export const createUserStreak = async (data: StreakCreateProps) => {
	try {
		loggers.info("StreaksController.createUserStreak: creating streak with data: " + JSON.stringify(data));
		return Streaks.create(data);
	} catch (err) {
		loggers.error("api.StreaksController.createUserStreak: ERROR", err);
		return;
	}
};

export const updateUserStreak = async (params: { user_tag: string; }, data: StreakUpdateProps) => {
	try {
		loggers.info("StreaksController.updateUserStreak: updating for user: " + params.user_tag);
		loggers.info("StreaksController.updateUserStreak: updating streak with data: " + JSON.stringify(data));
		return Streaks.update(params, data);
	} catch (err) {
		loggers.error("api.StreaksController.updateUserStreak: ERROR", err);
		return;
	} 
};
