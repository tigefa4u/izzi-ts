import { BattleTransactionProps } from "@customTypes/battle";
import { UserUpdateProps } from "@customTypes/users";
import { getCollectionById } from "api/controllers/CollectionInfoController";
import { createCollection } from "api/controllers/CollectionsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import transaction from "db/transaction";
import emoji from "emojis/emoji";
import { numericWithComma } from "helpers";
import {
	CONSOLE_BUTTONS,
	DEFAULT_ERROR_TITLE,
	DUNGEON_MIN_LEVEL,
	MANA_PER_BATTLE,
	MAX_GOLD_THRESHOLD,
	ranksMeta,
	REQUIRED_TRADE_LEVEL,
	USER_XP_GAIN_PER_BATTLE,
} from "helpers/constants";
import loggers from "loggers";
import { titleCase } from "title-case";
import { customButtonInteraction } from "utility/ButtonInteractions";
import { handleButtonActions, upgradeCard } from "../battleResult";
import { calculateUserProgress, calculateUserRewards, prepareFloorFodder } from "./rewards";

const validateBattleCard = async (id: number, user_id: number) => {
	try {
		loggers.info(
			"battleTransaction.validateBattleCard: validating card id " +
        id +
        " for uid " +
        user_id
		);
		const battleCard = await getCollectionById({
			user_id,
			id,
		});
		if (!battleCard || battleCard.length <= 0) {
			loggers.info("battleTransaction.validateBattleCard: card is invalid");
			return;
		}
		loggers.info("battleTransaction.validateBattleCard: card is valid");
		return true;
	} catch (err) {
		loggers.error("battleTransaction.validateBattleCard: ERROR", err);
		return;
	}
};

type R = {
  goldReward: number;
  rankId: number;
  rankReward: string;
  desc?: string;
  levelUpDesc?: string;
  menu?: { label: string; params: { id: string } }[];
};
export const processBattleTransaction = async ({
	result,
	multiplier,
	card,
	enemyCard,
	channel,
	author,
	user,
}: BattleTransactionProps) => {
	try {
		const embed = createEmbed(author).setTitle(DEFAULT_ERROR_TITLE);

		if (user.level < REQUIRED_TRADE_LEVEL) {
			embed.setHideConsoleButtons(true);
		}

		const isCardValid = await validateBattleCard(
			card.selected_card_id,
			user.id
		);
		if (!isCardValid) {
			embed.setDescription("This card does not belong to you");
			channel?.sendMessage(embed);
			return;
		}

		const xpGain = 
        (user.level < DUNGEON_MIN_LEVEL
        	? USER_XP_GAIN_PER_BATTLE
        	: USER_XP_GAIN_PER_BATTLE - 2) * multiplier;
		const manaToConsume = multiplier * MANA_PER_BATTLE;
		// Prepare win or lose and user data to update
		let updateUserDataStr = "";
		let manaConsumeRawStr = `mana = mana - ${manaToConsume}`;
		let userRewards: R | undefined;
		if (result.isVictory) {
			const refetchUser = await getRPGUser({ user_tag: author.id });
			if (!refetchUser) {
				channel?.sendMessage("Something's terribly wrong please contact support");
				return;
			}
			userRewards = calculateUserRewards(refetchUser, multiplier);
			if (!userRewards) {
				return;
			}
			const userProgress = calculateUserProgress(refetchUser, card, author, { xpGain });
			if (!userProgress) {
				return;
			}

			userRewards.levelUpDesc = userProgress.levelUpDesc;
			userRewards.desc = userProgress.desc;
			userRewards.menu = userProgress.menu;
			if (userProgress.levelUp) {
				manaConsumeRawStr = `mana = ${userProgress.rawUpdateObject.max_mana}`;
			}
			userProgress.upgradeObject.gold =
        userRewards.goldReward + userProgress.extraGold;
			if (refetchUser.gold >= MAX_GOLD_THRESHOLD) {
				delete userProgress.upgradeObject.gold;
			}
			updateUserDataStr = Object.keys(userProgress.upgradeObject)
				.map(
					(key) =>
						`${key} = ${key} + ${
							userProgress.upgradeObject[key as keyof UserUpdateProps]
						}`
				)
				.join(",");

			loggers.info("processBattleTransaction: updateStr for upgradeObj - " + updateUserDataStr);

			updateUserDataStr =
        `${updateUserDataStr === "" ? "" : updateUserDataStr + ","}` +
        Object.keys(userProgress.rawUpdateObject)
        	.map(
        		(key) => {
        			if (key === "reached_max_ruin_at") {
        				return `${key} = now()`;
        			} else {
        				return `${key} = ${
        					userProgress.rawUpdateObject[key as keyof UserUpdateProps]
        				}`;
        			}
        		}
        	)
        	.join(",");
		}

		loggers.info("updateStr after rawUpdateObj - " + updateUserDataStr);

		if (updateUserDataStr !== "" && !updateUserDataStr.startsWith(",")) {
			updateUserDataStr = "," + updateUserDataStr;
		}

		/**
     * Use DB Transactions to process the entire battle transaction
     * to avoid duplicating of gold and battle rewards
     */
		await transaction(async (trx) => {
			const updateStr = `update users set ${manaConsumeRawStr} ${updateUserDataStr}
		    where user_tag = '${author.id}' and mana >= ${manaToConsume}
		    and is_banned = false returning *`;
			loggers.info("battleTransaction.processBattleTransaction: user update transaction started",
		    " with raw query - " + updateStr);
			const updatedUserObj = await trx.raw(updateStr).then((res) => res.rows[0]);
			if (!updatedUserObj) {
				embed.setDescription("You did not have enough mana to process your battle!");
				channel?.sendMessage(embed);
				return trx.rollback();
			}
			loggers.info("battleTransaction.processBattleTransaction: user update completed ",
				updatedUserObj);

			const consoleButtons = [
				{
					label: CONSOLE_BUTTONS.VIEW_BATTLE_LOGS.label,
					params: {
						id: CONSOLE_BUTTONS.VIEW_BATTLE_LOGS.id,
						simulation: result.simulation,
						attachments: result.attachments,
					},
				},
			];
			if (result.isVictory) {
				const fodders = prepareFloorFodder({
					character_id: enemyCard.character_id,
					user_id: user.id,
					rankReward: userRewards?.rankReward || "platinum",
					rankId: userRewards?.rankId || ranksMeta.platinum.rank_id,
					multiplier
				});
				if (!fodders) {
					loggers.error("processBattleTransaction: could not prepare fodder for uid: " + author.id +
                    "enemy - ", enemyCard);
					channel?.sendMessage(`Summoner **${author.username}**, we were unable to process your battle. ` +
                    "Please try again later.");
					return trx.rollback();
				}
				const [ { xpGain: cardXpGain } ] = await Promise.all([
					upgradeCard(card, multiplier),
					createCollection(fodders)
				]);

				if (userRewards?.levelUpDesc) {
					channel?.sendMessage(userRewards.levelUpDesc);
				}
				if (userRewards?.desc) {
					try {
						const msg = await channel?.sendMessage(userRewards.desc);
						if (msg && (userRewards.menu || []).length > 0) {
							const buttons = customButtonInteraction(
								channel,
								userRewards.menu || [],
								author.id,
								handleButtonActions,
								() => {
									return;
								},
								false,
								10
							);
							if (buttons) {
								msg.editButton(buttons);
							}
						}
					} catch (err) {
						// pass
					}
				}

				embed.setTitle(`Victory ${emoji.celebration}`)
					.setDescription(
						`You have defeated __${titleCase(enemyCard.rank)}__ **${titleCase(
							enemyCard.name
						)}** in battle!`
					)
					.addField(
						`Rewards ${emoji.moneybag}`,
						`• You have gained __${xpGain}__xp and received __${
							numericWithComma(userRewards?.goldReward || 0)
						}__ gold ${emoji.gold}\n• __${multiplier}x__ ${titleCase(
							userRewards?.rankReward || "silver"
						)} copy of ${titleCase(enemyCard.name)}\n**${titleCase(
							card.name
						)}** has also gained __${cardXpGain}xp__ through this battle!`
					);
			} else {
				embed.setTitle(`Defeated... ${emoji.cry}`)
					.setDescription("Better luck next time.");

				consoleButtons.push({
					label: CONSOLE_BUTTONS.FLOOR_BT.label,
					params: {
						id: CONSOLE_BUTTONS.FLOOR_BT.id,
						simulation: undefined,
						attachments: undefined,
					},
				});
			}

			if (consoleButtons.length > 0) {
				const button = customButtonInteraction(
					channel,
					consoleButtons,
					author.id,
					handleButtonActions,
					() => {
						return;
					},
					false,
					10
				);
        
				if (button) {
					embed.setButtons(button);
				}
			}
			channel?.sendMessage(embed);
			return trx.commit();
		});
	} catch (err) {
		loggers.error(
			"rpg.adventure.battle.battleTransaction.processBattleTransaction: ERROR",
			err
		);
		channel?.sendMessage(`Summoner **${author.username}**, we were unable to process your battle.` +
        " Please try again later.");
		return;
	}
};
