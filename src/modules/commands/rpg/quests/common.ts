import {
	ProcessQuestProps,
	QuestCompleteCardRewardProps,
	QuestCriteria,
} from "@customTypes/quests";
import { getQuestByTypeAndLevel } from "api/controllers/QuestsController";
import { getUserStreaks } from "api/controllers/StreaksController";
import {
	completeQuest,
	getUserQuestByQuestid,
} from "api/controllers/UserQuestsController";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import {
	DEFAULT_QUEST_COMPLETE_TITLE,
	DOT,
	QUEST_TYPES,
	ranksMeta,
} from "helpers/constants";
import { DMUser } from "helpers/directMessages";
import { prepareRewards } from "helpers/embedLists/quests";
import { RanksMetaProps } from "helpers/helperTypes";
import loggers from "loggers";
import { titleCase } from "title-case";

const clearRaidChallengeCache = async (uid: string, type: string) => {
	if (type === QUEST_TYPES.RAID_CHALLENGE) {
		const rdKey = "raid_challenge_" + uid;
		return Cache.del(rdKey);
	} else if (type === QUEST_TYPES.RAID_CARRY) {
		const rdKey = "raid_mvp_challenge_" + uid;
		return Cache.del(rdKey);
	}
	return;
};

export const fetchAndCompleteQuest = async (
	params: ProcessQuestProps<unknown>,
	validateCriteria: (criteria: QuestCriteria, isDaily?: boolean) => boolean,
	cardRewardParams?: { character_id: number; user_id: number }
) => {
	try {
		const { level, type, user_tag, isDMUser } = params;
		loggers.info(
			"quests.common.fetchAndCompleteQuest: start quest process for uid: " +
        user_tag
		);
		const { author, client, channel } = params.options;
		const quests = await getQuestByTypeAndLevel({
			type: type,
			level: level,
		});
		if (!quests || quests.length <= 0) return;
		const quest = quests[0];

		const isCriteriaValid = validateCriteria(quest.criteria, quest.is_daily);
		if (!isCriteriaValid) return;

		loggers.info(
			"quests.common.fetchAndCompleteQuest: processing quest as criteria is valid"
		);
		const [ userQuest, streaks ] = await Promise.all([
			getUserQuestByQuestid({
				quest_id: quest.id,
				user_tag: author.id,
				is_daily: quest.is_daily,
			}),
			getUserStreaks({ user_tag: author.id }),
		]);
		if (userQuest && userQuest.length > 0) {
			await clearRaidChallengeCache(author.id, quest.type);
			return;
		}
		const cardReward = {} as QuestCompleteCardRewardProps;
		if (
			quest.reward.cards &&
      cardRewardParams &&
      cardRewardParams.character_id &&
      cardRewardParams.user_id &&
      quest.reward.cards.rank
		) {
			cardReward.user_id = cardRewardParams.user_id;
			cardReward.character_id = cardRewardParams.character_id;
			cardReward.rank = quest.reward.cards.rank;
			cardReward.rank_id =
        ranksMeta[cardReward.rank as keyof RanksMetaProps].rank_id;
		}
		await completeQuest(
			quest.reward,
			{
				user_tag: author.id,
				username: author.username,
				quest_id: quest.id,
				isUpdateUserQuestStreak: streaks && streaks.length > 0 ? true : false,
				cardReward,
			},
			(collections) => {
				let questStreaks = 1;
				if (streaks && streaks.length > 0) {
					questStreaks = (streaks[0].daily_quest_streaks || 0) + 1;
				}
				const embed = createEmbed(author, client)
					.setTitle(DEFAULT_QUEST_COMPLETE_TITLE)
					.setDescription(
						`**__${titleCase(quest.name)}__**\nCongratulations summoner **${
							author.username
						}**! You have completed your ` +
              "Daily Quest." +
              `\n\n**__Rewards__**\n${prepareRewards(
              	quest.reward,
              	true,
              	(collections || []).map((c) => c.id) || []
              )}` +
              `\n${DOT} Total quest streaks: __${questStreaks}__ :fire:${
              	quest.is_daily ? "\n\nCheck back again tomorrow for more." : ""
              }`
					)
					.setHideConsoleButtons(true);

				if (isDMUser) {
					DMUser(client, embed, user_tag);
				} else {
					channel?.sendMessage(embed);
				}
				return;
			}
		).catch((err) => {
			throw err;
		});
	} catch (err) {
		loggers.error("rpg.quests.common.fetchAndCompleteQuest: ERROR", err);
		return;
	}
};
