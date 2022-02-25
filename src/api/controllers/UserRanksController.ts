import { UserRankProps } from "@customTypes/userRanks";
import loggers from "loggers";
import * as UserRanks from "../models/UserRanks";

export const getUserRank = async (params: { user_tag: string }) => {
	try {
		const result = await UserRanks.getUserRank(params.user_tag);
		return result[0];
	} catch (err) {
		loggers.error(
			"api.controllers.UserRanksController.getUserRank(): something went wrong",
			err
		);
		return;
	}
};

export const createUserRank = async (data: Omit<UserRankProps, "id">) => {
	try {
		const result = await UserRanks.create(data);
		return result[0];
	} catch (err) {
		loggers.error(
			"api.controllers.UserRanksController.createUserRank(): something went wrong",
			err
		);
		return;
	}
};

export const updateUserRank = async (
	params: { user_tag: string },
	data: Partial<Omit<UserRankProps, "id">>
) => {
	try {
		loggers.info("Updating user ranks: " + JSON.stringify(params) + " Data: " + JSON.stringify(data));
		return await UserRanks.update(params, data);
	} catch (err) {
		loggers.error(
			"api.controllers.UserRanksController.updateUserRank(): something went wrong",
			err
		);
		return;
	}
};
