import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import Cache from "../../cache/index";
import emoji from "emojis/emoji";
import loggers from "loggers";
import { DMUserViaApi } from "server/pipes/directMessage";
import {
	DUNGEON_MAX_MANA,
	MAX_MANA_GAIN,
	STARTER_CARD_EXP,
	STARTER_CARD_LEVEL,
	STARTER_CARD_R_EXP,
} from "helpers/constants";
import { Request, Response } from "express";
import { UserProps, UserUpdateProps } from "@customTypes/users";
import { getMonthlyCard } from "api/controllers/MonthlyCardsController";
import { numericWithComma } from "helpers";
import { titleCase } from "title-case";
import { createCollection, directUpdateCreateFodder } from "api/controllers/CollectionsController";

export const processUpVote = async (req: Request, res: Response) => {
	try {
		const user_tag: string = req.body.user;
		const summoner = await getRPGUser({ user_tag: user_tag });
		const key = `voted::${user_tag}`;
		const hasVoted = await Cache.get(key);
		if (summoner?.is_banned) return;
		let desc = "";
		if (summoner && !hasVoted) {
			summoner.vote_count = (summoner.vote_count || 0) + 1;
			summoner.monthly_votes = (summoner.monthly_votes || 0) + 1;
			let streak = (summoner.vote_streak || 0) + 1;
			if (streak > 30) streak = 30;
			let goldReward = 2000 + 150 * streak;
			if (summoner.is_married) {
				goldReward = goldReward + 2000;
			}
			const passReward = summoner.is_married ? 2 : 1;
			if (summoner.raid_pass < summoner.max_raid_pass) {
				summoner.raid_pass = summoner.raid_pass + passReward;
			}

			summoner.gold = summoner.gold + goldReward;
			if (summoner.mana < summoner.max_mana) summoner.mana = summoner.max_mana;
			if (summoner.dungeon_mana < DUNGEON_MAX_MANA)
				summoner.dungeon_mana = DUNGEON_MAX_MANA;
			summoner.vote_streak = streak;
			summoner.voted_at = new Date();

			let messageStr =
        "Thank you for voting! You have received " +
        `__${numericWithComma(goldReward)}__ Gold ${
        	emoji.gold
        }, __${passReward}__ Raid Permit(s) ${emoji.permitsic}, ` +
        "and refilled your mana and dungeon mana for dailying.";
			const updateObj = {
				voted_at: summoner.voted_at,
				vote_streak: summoner.vote_streak,
				mana: summoner.mana,
				gold: summoner.gold,
				raid_pass: summoner.raid_pass,
				dungeon_mana: summoner.dungeon_mana,
				vote_count: summoner.vote_count,
				monthly_votes: summoner.monthly_votes,
			} as UserUpdateProps;

			if (summoner.is_premium) {
				const IPreward = 4;
				summoner.izzi_points = summoner.izzi_points
					? summoner.izzi_points + IPreward
					: IPreward;

				Object.assign(updateObj, { izzi_points: summoner.izzi_points });
				messageStr = `${messageStr} You have also received ${emoji.izzipoints} __${IPreward}__ IP.`;
			}

			// monthly bonus rewards
			const monthlyRewards = await processMonthlyVoteReward(summoner);
			if (monthlyRewards.reward) {
				const reward = monthlyRewards.reward;
				if (reward.gold) {
					updateObj.gold = (updateObj.gold || 0) + reward.gold;
				}
				if (reward.shards) {
					updateObj.shards = summoner.shards + reward.shards;
				}
				if (reward.raid_pass) {
					updateObj.raid_pass = reward.raid_pass + (updateObj.raid_pass || 0);
				}
				if (reward.exp) {
					monthlyRewards.desc = `${monthlyRewards.desc}__${reward.exp}__ Exp`;
					const currentExp = summoner.exp + reward.exp;
					const requiredExp = summoner.r_exp;
					if (currentExp >= requiredExp) {
						summoner.level = summoner.level + 1;
						summoner.exp = Math.abs(currentExp - requiredExp);
						summoner.r_exp = summoner.level * 47;
						if (summoner.max_mana < MAX_MANA_GAIN) {
							summoner.max_mana = summoner.max_mana + 2;
							updateObj.max_mana = summoner.max_mana;
						}
						summoner.mana = summoner.max_mana;
						updateObj.mana = summoner.mana;
						updateObj.r_exp = summoner.exp;
						updateObj.level = summoner.level;
					}
					updateObj.exp = currentExp;
				}

				messageStr = `${messageStr}\n\n**__Monthly Bonus Reward__**\n${monthlyRewards.desc}`;
			}

			await updateRPGUser({ user_tag }, updateObj);
			desc = messageStr;
		} else {
			desc =
        "Thank you for voting! To receive more rewards " +
        "start your journey in the Xenverse using ``start``";
		}
		DMUserViaApi(user_tag, { content: desc });
		await Cache.set(key, "1");
		Cache.expire && (await Cache.expire(key, 60 * 60));
		return res.sendStatus(200);
	} catch (err: any) {
		loggers.error(
			"server.controllers.WebhookController.processUpvote: ERROR",
			err
		);
		return res.status(500).send({
			error: true,
			message: err.message,
		});
	}
};

const monthlyCardMatrix = [
	{
		vote: 1,
		reward: { gold: 6000 },
	},
	{
		vote: 2,
		reward: { exp: 100 },
	},
	{
		vote: 3,
		reward: { raid_pass: 2 },
		premiumReward: { raid_pass: 4 },
	},
	{
		vote: 4,
		reward: { gold: 8000 },
	},
	{
		vote: 5,
		reward: { shards: 30 },
		premiumReward: { shards: 40 },
	},
	{
		vote: 6,
		reward: {
			type: "fodder",
			number: 30,
			rank: "platinum",
			rank_id: 3,
		},
	},
	{
		vote: 7,
		reward: {
			type: "immortal",
			number: 1,
			rank: "immortal",
			rank_id: 7,
		},
	},
];

const prepMatrix = () => {
	// total 35 votes
	const total = 35;
	const matrix = [];
	for (let i = 0; i < total; i++) {
		const item = monthlyCardMatrix[i % 7];
		matrix.push({
			vote: i + 1,
			reward: item.reward,
			premiumReward: item.premiumReward,
		}); // 7x5 matrix
	}
	return matrix;
};

const processMonthlyVoteReward = async (user: UserProps) => {
	let desc = "";
	const monthlyCard = await getMonthlyCard();
	const card = (monthlyCard || [])[0];
	if (!card)
		return {
			desc: `__6,000__ Gold ${emoji.gold}`,
			reward: { gold: 6000 },
		};
	const rewardArray = prepMatrix();
	const item = rewardArray[user.monthly_votes - 1];
	if (!item) {
		return {
			desc: `__6,000__ Gold ${emoji.gold}`,
			reward: { gold: 6000 },
		};
	}
	if (item.reward.type === "immortal" || item.reward.type === "fodder") {
		if (item.reward.type === "fodder") {
			await directUpdateCreateFodder([ {
				character_id: card.character_id,
				user_id: user.id,
				count: item.reward.number
			} ]);
		}
		if (item.reward.type === "immortal") {
			await createCollection({
				exp: STARTER_CARD_EXP,
				character_level: STARTER_CARD_LEVEL,
				rank: item.reward.rank,
				rank_id: item.reward.rank_id,
				user_id: user.id,
				is_tradable: true,
				is_item: false,
				is_favorite: false,
				is_on_cooldown: false,
				r_exp: STARTER_CARD_R_EXP,
				character_id: card.character_id,
				card_count: item.reward.number || 1,
			});
		}
		desc = `${desc}__${
			item.reward.number
		}x__ Level ${STARTER_CARD_LEVEL} ${titleCase(item.reward.rank)} ${titleCase(
			card.name
		)}\n`;
	}

	let userReward = item.reward;
	if (user.is_premium && item.premiumReward) {
		userReward = item.premiumReward;
	}
	if (userReward.gold) {
		desc = `${desc}__${numericWithComma(userReward.gold)}__ Gold ${
			emoji.gold
		}\n`;
	}
	if (userReward.shards) {
		desc = `${desc}__${numericWithComma(userReward.shards)}__ Shards ${
			emoji.shard
		}\n`;
	}
	if (userReward.raid_pass) {
		desc = `${desc}__${numericWithComma(
			userReward.raid_pass
		)}x__ Raid Permit(s) :ticket:\n`;
	}
	return {
		desc,
		reward: userReward,
	};
};

/**
 * DEPRICATED
 */
// export const processServerUpvote = async (req: Request, res: Response) => {
// 	try {
// 		const user_tag: string = req.body.user;
// 		const summoner = await getRPGUser({ user_tag: user_tag });
// 		if (summoner?.is_banned) return;
// 		let desc = "";
// 		if (summoner) {
// 			let streak = summoner.vote_streak ? summoner.vote_streak + 1 : 1;
// 			if (streak > 30) streak = 30;
// 			let goldReward = 2000 + 200 * streak;
// 			if (summoner.is_married) {
// 				goldReward = goldReward + 1000;
// 			}
// 			const passReward = summoner.is_premium ? 2 : 1;
// 			if (summoner.raid_pass < summoner.max_raid_pass) {
// 				summoner.raid_pass = summoner.raid_pass + passReward;
// 			}
// 			const shardReward = summoner.is_premium ? 10 : 5;
// 			summoner.shards = summoner.shards + shardReward;
// 			summoner.gold = summoner.gold + goldReward;

// 			const messageStr =
//         "Thank you for voting **XeneX Server**! You have received " +
//         `__${goldReward}__ Gold ${emoji.gold}, __${passReward}__ Raid Permit(s) ${emoji.permitsic}, ` +
// 		`__${shardReward}__ Shards ${emoji.shard} ` +
//         "for dailying.";
// 			const updateObj = {
// 				shards: summoner.shards,
// 				gold: summoner.gold,
// 				raid_pass: summoner.raid_pass,
// 			};

// 			// if (summoner.is_premium) {
// 			// 	const IPreward = randomNumber(3, 4);
// 			// 	summoner.izzi_points = summoner.izzi_points
// 			// 		? summoner.izzi_points + IPreward
// 			// 		: IPreward;

// 			// 	Object.assign(updateObj, { izzi_points: summoner.izzi_points });
// 			// 	messageStr = `${messageStr} You have also received ${emoji.izzipoints} __${IPreward}__ IP.`;
// 			// }
// 			await updateRPGUser({ user_tag }, updateObj);
// 			desc = messageStr;
// 		} else {
// 			desc =
//         "Thank you for voting **XeneX Server**! To receive more rewards " +
//         "start your journey in the Xenverse using ``start``";
// 		}
// 		DMUserViaApi(user_tag, { content: desc });
// 		return res.sendStatus(200);
// 	} catch (err: any) {
// 		loggers.error("server.controllers.WebhookController.processServerUpvote: ERROR", err);
// 		return res.status(500).send({
// 			error: true,
// 			message: err.message
// 		});
// 	}
// };
