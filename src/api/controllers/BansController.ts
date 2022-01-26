import loggers from "loggers";
import * as Bans from "../models/Bans";

export const getUserBan = async (params: { user_tag: string }) => {
	try {
		const result = await Bans.get(params);
		return result && result[0];
	} catch (err) {
		loggers.error("api.controllers.BansController.getUserBan(): something went wrong", err);
		return;
	}
};