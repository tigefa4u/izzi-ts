import { ResponseWithPagination } from "@customTypes";
import {
	CollectionCreateProps,
	CollectionProps,
} from "@customTypes/collections";
import { PageProps } from "@customTypes/pagination";
import { QuestCompleteCardRewardProps, QuestProps, QuestResultProps, QuestTypes } from "@customTypes/quests";
import { UserQuestCreateProps } from "@customTypes/quests/users";
import { startTransaction } from "api/models/Users";
import Cache from "cache";
import {
	QUEST_TYPES,
	STARTER_CARD_EXP,
	STARTER_CARD_LEVEL,
	STARTER_CARD_R_EXP,
} from "helpers/constants";
import { paginationForResult, paginationParams } from "helpers/pagination";
import loggers from "loggers";
import * as Quests from "../models/Quests";
import * as UserQuests from "../models/UserQuests";

export const getUserQuests = async (
	params: { level: number; user_tag: string },
	filter: PageProps
): Promise<ResponseWithPagination<QuestResultProps[]> | undefined> => {
	try {
		// OPTIMIZE - Find a way to cache 'quests'
		loggers.info(
			"UserQuestsController.getUserQuests: Fetching user quest details for user level: " +
        params.level
		);
		const result = await Quests.getByUserLevel(
			params,
			await paginationParams({
				currentPage: filter.currentPage,
				perPage: filter.perPage,
			})
		);

		const pagination = await paginationForResult({
			data: result,
			query: filter,
		});

		const resp = await UserQuests.get({
			user_tag: params.user_tag,
			quest_id: result.filter((q) => !q.is_daily).map((r) => r.id),
			is_daily_quest: true,
		});
		const userQuestIds = resp.map((r) => r.quest_id);
		const data = await Promise.all(result.map(async (item) => {
			const object = item as QuestResultProps;
			if (userQuestIds.includes(item.id)) {
				object.hasCompleted = true;
			} else {
				if (item.type === QUEST_TYPES.RAID_CHALLENGE) {
					const cacheKey = "raid_challenge_" + params.user_tag;
					const cacheData = await Cache.get(cacheKey);
					if (cacheData) {
						object.completedRaids = JSON.parse(cacheData);
					} else {
						object.completedRaids = 0;
					}
				} else if (item.type === QUEST_TYPES.RAID_CARRY) {
					const cacheKey = "raid_mvp_challenge_" + params.user_tag;
					const cacheData = await Cache.get(cacheKey);
					if (cacheData) {
						object.completedRaids = JSON.parse(cacheData);
					} else {
						object.completedRaids = 0;
					} 
				}
				object.hasCompleted = false;
			}
			return object;
		}));

		// data = data.filter((item) => !item.hasCompleted);
		return {
			data,
			metadata: pagination,
		};
	} catch (err) {
		loggers.error("api.UserQuestsController.getUserQuests: ERROR", err);
		return;
	}
};

export const createUserQuest = async (data: UserQuestCreateProps) => {
	try {
		loggers.info(
			"UserQuestsController.createUserQuest: creating with data: ", data
		);
		return UserQuests.create(data);
	} catch (err) {
		loggers.error("api.UserQuestsController.createUserQuest: ERROR", err);
		return;
	}
};

export const getUserQuestByQuestid = async (params: {
  user_tag: string;
  quest_id: number | number[];
  is_daily?: boolean;
}) => {
	try {
		loggers.info(
			"api.UserQuestsController.getUserQuestByQuestid: fetching data with query params - ", params
		);
		return UserQuests.get({
			quest_id: params.quest_id,
			user_tag: params.user_tag,
			is_daily_quest: params.is_daily || false,
			useAndClause: true,
		});
	} catch (err) {
		loggers.error("api.UserQuestsController.getUserQuestByQuestId: ERROR", err);
		return;
	}
};

export const getUserQuestByType = async (params: {
  level: number;
  user_tag: string;
  type: QuestTypes;
  is_daily?: boolean;
}) => {
	try {
		loggers.info("fetching user quest by type: ", params);
		return UserQuests.getByQuestType(params);
	} catch (err) {
		loggers.error("api.UserQuestsController.getUserQuestByType: ERROR", err);
		return;
	}
};

export const completeQuest = async (
	questReward: QuestProps["reward"],
	params: {
    user_tag: string;
    username: string;
    quest_id: number;
    cardReward?: QuestCompleteCardRewardProps;
    isUpdateUserQuestStreak?: boolean;
  },
	callback: (cards?: CollectionProps[]) => void
) => {
	try {
		return startTransaction(async (trx) => {
			try {
				const bodyParams = { gold: trx.raw(`gold + ${questReward.gold.amount}`), } as any;
				if (questReward.orbs) {
					bodyParams.orbs = trx.raw(`orbs + ${questReward.orbs.amount}`);
				}
				if (questReward.raid_pass) {
					bodyParams.raid_pass = trx.raw(
						`raid_pass + ${questReward.raid_pass.amount}`
					);
				}
				loggers.info(
					"UserQuestsController: [transaction] Updating user quest rewards with data: ",
					questReward);

				const data = {
					user_tag: params.user_tag,
					username: params.username,
					reward: questReward,
					quest_id: params.quest_id,
				};
				loggers.info(
					"UserQuestsController: [transaction] creating user quest with data: " +
            		data
				);
				const updatedObj = await trx("users")
					.where({ user_tag: params.user_tag })
					.update(bodyParams)
					.returning("*")
					.then((res) => res[0]);

				const questCreated = await trx("user_quests")
					.insert(data)
					.returning("*")
					.then((res) => res[0]);

				let createdCollection;

				if (
					questReward.cards &&
          params.cardReward &&
          params.cardReward.user_id
				) {
					const reward = params.cardReward;
					const collectionData = Array(questReward.cards.amount)
						.fill("0")
						.map(
							(_) =>
								({
									user_id: reward.user_id,
									character_id: reward.character_id,
									rank_id: reward.rank_id,
									rank: reward.rank,
									character_level: STARTER_CARD_LEVEL,
									r_exp: STARTER_CARD_R_EXP,
									exp: STARTER_CARD_EXP,
									is_item: false,
								} as CollectionCreateProps)
						);

					loggers.info(
						"UserQuestsController: [transaction] creating collection data - " +
						collectionData
					);

					createdCollection = await trx("collections")
						.insert(collectionData)
						.returning("*");
				}

				if (params.isUpdateUserQuestStreak) {
					loggers.info(
						"UserQuestsController.completeQuest: [transaction] updating quest streak"
					);
					const res = await trx("streaks")
						.where({ user_tag: params.user_tag })
						.update({
							daily_quest_streaks: trx.raw("daily_quest_streaks + 1"),
							daily_quest_updated_at: trx.raw("now()") 
						})
						.returning("*");
					if (!res || res.length <= 0) {
						throw new Error("Unable to update quest streak");
					}
				} else {
					loggers.info(
						"UserQuestsController.completeQuest: [transaction] creating quest streak"
					);
					const streakCreated = await 
					trx("streaks")
						.insert({
							user_tag: params.user_tag,
							username: params.username,
							daily_quest_streaks: 1,
							daily_quest_updated_at: new Date(0)
						})
						.returning("*");

					if (!streakCreated || streakCreated.length <= 0) {
						throw new Error("Unable to create quest streak");
					}
				}

				if (!updatedObj || !questCreated) {
					throw new Error("Unable to create user quest");
				}
				callback(createdCollection);
				return trx.commit();
			} catch (err) {
				loggers.error(
					"controllers.UserQuestsController.completeQuest: transaction failed ",
					err
				);
				return trx.rollback();
			}
		});
	} catch (err) {
		loggers.error(
			"api.controllers.UserQuestsController.completeQuest: ERROR",
			err
		);
		throw err;
	}
};
