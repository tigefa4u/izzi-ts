import { getUserRaidLobby } from "api/controllers/RaidsController";
import { getRPGUser } from "api/controllers/UsersController";
import loggers from "loggers";
import { ERROR_CONSTANTS } from "server/helpers/errorConstants";
import { error, notFound, success } from "server/responses";

// TODO - build rate limitations for all external apis
/**
 * 
 * @param req - query params with prop 'summoner' string
 * @param res 
 * @returns RaidProps
 */
export const getUserRaid = async (req: any, res: any) => {
	try {
		const summoner = req.query.summoner;
		if (!summoner || typeof summoner !== "string") {
			return error(res, 422, "Invalid query params - 'summoner' must be string");
		}
		const user = await getRPGUser({ user_tag: summoner }, { cached: true });
		if (!user) {
			return notFound(res, "This summoner does not exist in the Xenverse");
		}
		const raid = await getUserRaidLobby({ user_id: user.id });
		if (!raid) {
			return error(res, 404, "This summoner is currently not in a raid", ERROR_CONSTANTS.RAID_DOES_NOT_EXIST);
		}
		return success(res, raid);
	} catch (err: any) {
		loggers.error("server.controllers.ExternalApiController.getUserRaid: ERROR", err);
		return res.status(500).send({
			error: true,
			message: err.message,
		});
	}
};

export const getElementalData = async (req: any, res: any) => {
	try {
		return success(res, {});
	} catch (err: any) {
		loggers.error("server.controllers.ExternalApiController.getElementalData: ERROR", err);
		return res.status(500).send({
			error: true,
			message: err.message,
		}); 
	}
};