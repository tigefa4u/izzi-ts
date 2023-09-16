import { ProcessQuestProps } from "@customTypes/quests";
import { RaidLobbyProps } from "@customTypes/raids";
import { getRPGUser } from "api/controllers/UsersController";
import Cache from "cache";
import { RankProps } from "helpers/helperTypes";
import loggers from "loggers";
import { clone } from "utility";
import { fetchAndCompleteQuest } from "../common";

export const processRaidChallengeQuest = async <ET extends {
    lobby: RaidLobbyProps;
    raidRank: RankProps;
    characterId: number;
    raidId: number;
}>(params: ProcessQuestProps<ET>) => {
	try {
		if (!params.options.extras) return;
		const { lobby, raidRank, characterId, raidId } = params.options.extras;
		if (!lobby || !characterId || isNaN(characterId)) return;

		loggers.info("quests.functions.raidChallenge: started raid challenge quest process for raidID: " 
        + raidId);
		params.isDMUser = true;
		await Promise.all(Object.keys(lobby).map(async (key) => {
			const member = lobby[+key as keyof RaidLobbyProps];
			const funcParams = clone(params);
			funcParams.user_tag = member.user_tag;
			const cachekey = "raid_challenge_" + member.user_tag;
			// eslint-disable-next-line prefer-const
			const [ user, raidsCompletedCache, _author ] = await Promise.all([
				getRPGUser({ user_tag: member.user_tag }),
				Cache.get(cachekey),
				params.options.client.users.fetch(member.user_tag)
			]);
			if (!user) return;
			funcParams.level = user.level;
			funcParams.options.author = _author;
			funcParams.options.client = params.options.client;
			funcParams.options.channel = params.options.channel;
			let raidsCompleted: number = JSON.parse(raidsCompletedCache || "0");

			fetchAndCompleteQuest(funcParams, (criteria, isDaily) => {
				if (!criteria.toComplete) return false;
				raidsCompleted = raidsCompleted + 1;
				if (criteria.isAnyDifficulty && raidsCompleted >= criteria.toComplete) {
					Cache.del(cachekey);
					return true;
				} else if (raidsCompleted >= criteria.toComplete && criteria.difficulty === raidRank) {
					Cache.del(cachekey);
					return true;
				} else {
					if (criteria.isAnyDifficulty || criteria.difficulty === raidRank) {
						Cache.set(cachekey, `${raidsCompleted}`);
						if (isDaily) {
							Cache.expireEod(cachekey);
						} else {
							Cache.expire && Cache.expire(cachekey, 60 * 60 * 23 * 30);
						}
						return false;
					}
				}
				return false;
			}, {
				user_id: user.id,
				character_id: characterId
			});
		}));
		return;
	} catch (err) {
		loggers.error("quests.functions.raidChallenge.processRaidChallenge: ERROR", err);
		return;
	}
};