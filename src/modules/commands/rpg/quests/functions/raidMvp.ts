import { ProcessQuestProps } from "@customTypes/quests";
import { RaidLobbyProps } from "@customTypes/raids";
import { getRPGUser } from "api/controllers/UsersController";
import Cache from "cache";
import { RankProps } from "helpers/helperTypes";
import { getLobbyMvp } from "helpers/raid";
import loggers from "loggers";
import { fetchAndCompleteQuest } from "../common";

export const processRaidMvpQuest = async <ET extends {
    lobby: RaidLobbyProps;
    raidRank: RankProps;
    characterId: number;
    raidId: number;
}>(params: ProcessQuestProps<ET>) => {
	try {
		const lobby = params.options.extras?.lobby;
		const raidRank = params.options.extras?.raidRank;
		const characterId = params.options.extras?.characterId;
		if (!lobby || !raidRank || !characterId) return;
		const mvp = getLobbyMvp(lobby);
		if (!mvp) return;
		const member = lobby[mvp as keyof RaidLobbyProps];
		loggers.info("quests.functions.raidMvp.processRaidMvp: mvp found - ",
			member);

		const user = await getRPGUser({ user_tag: member.user_tag });
		if (!user) return;
		params.level = user.level;

		loggers.info("quests.functions.raidMvp.processRaidMvp: mvp quest started for raid ID: " + 
        params.options.extras?.raidId || "No ID found");
		loggers.info(`mvp quest - user tag has been switched from ${params.user_tag} to ${member.user_tag}`);
		params.user_tag = member.user_tag;
		params.isDMUser = true;
		const key = "raid_mvp_challenge_" + params.user_tag;
		const raidsCompletedCache = await Cache.get(key);
		fetchAndCompleteQuest(params, (criteria, isDaily) => {
			const isValid = criteria.difficulty === raidRank && criteria.isMvp;
			if (isValid) {
				let raidsCompleted = JSON.parse(raidsCompletedCache || "0");
				raidsCompleted = raidsCompleted + 1;
				if (criteria.toComplete && raidsCompleted >= criteria.toComplete) {
					Cache.del(key);
					return true;
				} else {
					Cache.set(key, `${raidsCompleted}`);
					if (isDaily) {
						Cache.expireEod(key);
					} else {
						Cache.expire && Cache.expire(key, 60 * 60 * 23 * 30);
					}
					return false;
				}
			}
			return false;
		}, {
			user_id: mvp,
			character_id: characterId
		});
		return;
	} catch (err) {
		loggers.error("quests.functions.raidMvp.processRaidMvp: ERROR", err);
		return;
	}
};