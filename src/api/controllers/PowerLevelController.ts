import { PLProps } from "@customTypes/powerLevel";
import Cache from "cache";
import { RankProps } from "helpers/helperTypes";
import loggers from "loggers";
import * as Ranks from "../models/Ranks";

export const getPowerLevelByRank = async (params: { rank: RankProps }): Promise<PLProps | undefined> => {
	try {
		const key = `PL::${params.rank}`;
		const result = await Cache.fetch(key, async () => {
			let res: PLProps[] | PLProps = await Ranks.get(params);
			res = res[0];
			return res;
		});

		return result;
	} catch (err) {
		loggers.error("api.controllers.PowerLevelController.getPowerLevelByRank: ERROR", err);
		return;
	}
};

export const getPowerLevelByRankId = async (params: { rank_id: number }): Promise<PLProps | undefined> => {
	try {
		let res: PLProps[] | PLProps = await Ranks.get(params);
		res = res[0];
		return res;
	} catch (err) {
		loggers.error("api.controllers.PowerLevelController.getPowerLevelByRank: ERROR", err);
		return;
	}
};