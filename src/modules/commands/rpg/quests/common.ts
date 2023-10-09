import {
	ProcessQuestProps,
	QuestCompleteCardRewardProps,
	QuestCriteriaProps,
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
} from "helpers/constants";
import { DMUser } from "helpers/directMessages";
import { prepareRewards } from "helpers/embedLists/quests";
import { RanksMetaProps } from "helpers/helperTypes";
import { ranksMeta } from "helpers/rankConstants";
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
	validateCriteria: (criteria: QuestCriteriaProps, isDaily?: boolean, isWeekly?: boolean) => boolean,
	cardRewardParams?: { character_id: number; user_id: number }
) => {
	try {
		const { level, type, user_tag, isDMUser } = params;
		loggers.info(
			"quests.common.fetchAndCompleteQuest: start quest process for uid: " +
        user_tag
		);
		const { client, channel } = params.options;
		const [ quests, _author ] = await Promise.all([
			getQuestByTypeAndLevel({
				type: type,
				level: level,
			}),
			client.users.fetch(user_tag)
		]);
		if (!quests || quests.length <= 0) return;
		const quest = quests[0];
		params.options.author = _author;
		const author = _author;
		const isCriteriaValid = validateCriteria(quest.criteria, quest.is_daily, quest.is_weekly);
		if (!isCriteriaValid) return;

		if (!author.id) {
			author.id = user_tag;
		}

		loggers.info(
			"quests.common.fetchAndCompleteQuest: processing quest as criteria is valid"
		);
		const [ userQuest, streaks ] = await Promise.all([
			getUserQuestByQuestid({
				quest_id: quest.id,
				user_tag: user_tag,
				is_daily: quest.is_daily,
				is_weekly: quest.is_weekly
			}),
			getUserStreaks({ user_tag: user_tag }),
		]);
		if (userQuest && userQuest.length > 0) {
			await clearRaidChallengeCache(user_tag, quest.type);
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
				user_tag: user_tag,
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
              `${quest.is_daily ? "Daily " : quest.is_weekly ? "Weekly " : ""}Quest.` +
              `\n\n**__Rewards__**\n${prepareRewards(
              	quest.reward,
              	true,
              	(collections || []).map((c) => c.id) || []
              )}` +
              `\n${DOT} Total quests completed: __${questStreaks}__ :fire:${
              	quest.is_daily ? "\n\nCheck back again tomorrow for more." : ""
              }${quest.is_weekly ? "\n\nCheck back again on Monday for more." : ""}`
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
