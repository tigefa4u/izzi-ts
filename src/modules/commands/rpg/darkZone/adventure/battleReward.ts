import { AuthorProps, ChannelProp } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { DarkZoneProfileProps } from "@customTypes/darkZone/profile";
import { UserProps } from "@customTypes/users";
import { RawUpdateProps } from "@customTypes/utility";
import {
	getDarkZoneProfile,
	updateRawDzProfile,
} from "api/controllers/DarkZoneController";
import { getRPGUser, updateUserRaw } from "api/controllers/UsersController";
import { startTransaction } from "api/models/Users";
import { createEmbed } from "commons/embeds";
import { Client } from "discord.js";
import emoji from "emojis/emoji";
import { numericWithComma, randomNumber } from "helpers";
import {
	CONSOLE_BUTTONS,
	DEFAULT_ERROR_TITLE,
	DOT,
	MANA_PER_BATTLE,
	MAX_MANA_GAIN,
	USER_XP_GAIN_PER_BATTLE,
} from "helpers/constants/constants";
import { DZ_INVENTORY_SLOTS_PER_LEVEL } from "helpers/constants/darkZone";
import loggers from "loggers";
import { clone } from "utility";
import { customButtonInteraction } from "utility/ButtonInteractions";
import { invokeDarkZone } from "..";
import { floor } from "../../zoneAndFloor/floor";

type P = {
  isVictory: boolean;
  author: AuthorProps;
  dzUser?: DarkZoneProfileProps;
  multiplier: number;
  battlingFloor: number;
  channel: ChannelProp;
  client: Client;
  user?: UserProps;
};
export const processBattleRewards = async ({
	isVictory,
	author,
	dzUser,
	multiplier,
	battlingFloor,
	channel,
	client,
	user,
}: P) => {
	try {
		let clonedDzUser: DarkZoneProfileProps | undefined = undefined;
		if (dzUser) {
			clonedDzUser = clone(dzUser);
		} else {
			clonedDzUser = await getDarkZoneProfile({ user_tag: author.id });
		}
		if (!clonedDzUser) return;
		let clonedUser: UserProps | undefined;
		if (user) {
			clonedUser = clone(user);
		} else {
			clonedUser = await getRPGUser(
				{ user_tag: author.id },
				{ forceFetchFromDB: true }
			);
		}
		if (!clonedUser) return;
		const manaToConsume = multiplier * MANA_PER_BATTLE;
		if (clonedUser.mana < manaToConsume) {
			channel?.sendMessage(
				"You did not have sufficient mana to process your battle :x:"
			);
			return;
		}

		const reward = calculateUserDzReward({
			isVictory,
			level: clonedDzUser.level,
			currentExp: clonedDzUser.exp,
			r_exp: clonedDzUser.r_exp,
			battlingFloor,
			maxFloor: clonedDzUser.max_floor,
			multiplier,
		});
		const userReward = calculateUserReward({
			isVictory,
			user: clone(clonedUser),
			multiplier,
		});
		const showBonus = battlingFloor >= clonedDzUser.max_floor && isVictory;
		let rewardDesc =
      `${DOT} __${numericWithComma(reward.gold)}__ Gold ${emoji.gold}\n` +
      `${DOT} __${numericWithComma(reward.fragments)}__ Fragments ${emoji.fragments}${
      	showBonus ? ` (+${multiplier * 3} Fragments Bonus)` : ""
      }\n` +
      `${DOT} __${numericWithComma(reward.expGain)}__ Exp${
      	showBonus ? ` (+${multiplier * 12} Exp Bonus)` : ""
      }${
      	userReward?.xpGain ? `\n${DOT} __${userReward.xpGain}xp__ Izzi Exp` : ""
      }`;

		const params = {
			fragments: {
				op: "+",
				value: reward.fragments,
			},
			exp: {
				op: "=",
				value: reward.exp,
			},
		} as RawUpdateProps<DarkZoneProfileProps>;
		if (isVictory && clonedDzUser && battlingFloor >= clonedDzUser.max_floor) {
			params.max_floor = {
				op: "+",
				value: 1,
			};
			params.reached_max_floor_at = {
				op: "=",
				value: new Date() as any,
			};
		}

		const updateObj = {
			mana: {
				op: "-",
				value: manaToConsume,
			},
			gold: {
				op: "+",
				value: reward.gold,
			},
		} as RawUpdateProps<UserProps>;
		if (isVictory && userReward) {
			Object.assign(updateObj, {
				exp: {
					op: "=",
					value: userReward.exp,
				},
				r_exp: {
					op: "=",
					value: userReward.r_exp,
				},
			});
			if (clonedUser.level < userReward.level) {
				channel?.sendMessage(
					`Yay **${author.username}**! You have leveled up! ` +
            `You are now level ${clonedUser.level + 1} ${emoji.celebration}. ` +
            "We've refilled your mana." +
            `${
            	clonedUser.max_mana < MAX_MANA_GAIN
            		? ` Your Max Mana is now __${clonedUser.max_mana}__ -> __${
            			clonedUser.max_mana + 2
            		}__`
            		: ""
            }`
				);
				clonedUser.mana = clonedUser.mana - manaToConsume;
				updateObj.level = {
					op: "+",
					value: 1,
				};
				if (clonedUser.max_mana < MAX_MANA_GAIN) {
					clonedUser.max_mana = clonedUser.max_mana + 2;
					updateObj.max_mana = {
						op: "+",
						value: 2,
					};
				}
				if (clonedUser.mana < clonedUser.max_mana) {
					updateObj.mana = {
						op: "=",
						value: clonedUser.max_mana,
					};
				}
			}
		}
		if (reward.level > 0) {
			params.level = {
				op: "+",
				value: reward.level,
			};
			rewardDesc =
        rewardDesc +
        `\n${DOT} +${DZ_INVENTORY_SLOTS_PER_LEVEL} Inventory Max Slots` +
        `\n${DOT} +1 Level up\n${DOT} We have also refilled __${clonedUser.max_mana}__ Mana`;

			clonedUser.mana = clonedUser.mana - manaToConsume;
			if (clonedUser.mana < clonedUser.max_mana) {
				updateObj.mana = {
					op: "=",
					value: clonedUser.max_mana,
				};
			}
		}

		await Promise.all([
			updateRawDzProfile({ user_tag: author.id }, params),
			updateUserRaw({ user_tag: author.id }, updateObj),
		]);
		let desc = "Better luck next time.";
		if (isVictory) {
			desc = `Congratulations summoner **${author.username}**, you have defeated the floor boss and received`;
			if (clonedDzUser && battlingFloor >= clonedDzUser.max_floor) {
				rewardDesc =
          rewardDesc +
          "\n\n**You have defeated this floor boss and " +
          "can move to the next one using `iz fl n -dz`**";
			}
		}
		const embed = createEmbed(author, client)
			.setTitle(
				isVictory ? `Victory ${emoji.celebration}` : `Defeated ${emoji.cry}`
			)
			.setDescription(`${desc}\n\n**__Rewards__**\n${rewardDesc}`)
			.setHideConsoleButtons(true);

		if (isVictory) {
			const buttons = customButtonInteraction(
				channel,
				[
					{
						label: CONSOLE_BUTTONS.DARK_ZONE_BT_ALL.label,
						params: { id: CONSOLE_BUTTONS.DARK_ZONE_BT_ALL.id },
					},
					{
						label: CONSOLE_BUTTONS.DARK_ZONE_NEXT_FLOOR.label,
						params: { id: CONSOLE_BUTTONS.DARK_ZONE_NEXT_FLOOR.id },
					},
				],
				author.id,
				(params) => {
					switch (params.id) {
						case CONSOLE_BUTTONS.DARK_ZONE_BT_ALL.id: {
							invokeDarkZone({
								context: { channel } as BaseProps["context"],
								client,
								options: { author },
								args: [ "bt", "all" ],
							});
							return;
						}
						case CONSOLE_BUTTONS.DARK_ZONE_NEXT_FLOOR.id: {
							floor({
								client,
								options: { author },
								context: { channel } as BaseProps["context"],
								args: [ "n", "-dz" ],
							});
							return;
						}
					}
				},
				() => {
					return;
				},
				false,
				1
			);
			if (buttons) {
				embed.setButtons(buttons);
			}
		}

		channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("darkZone.battleReward: ERROR", err);
		return;
	}
};

type C = {
  isVictory: boolean;
  user: UserProps;
  multiplier: number;
};
const calculateUserReward = ({ isVictory, user, multiplier = 1 }: C) => {
	if (!isVictory) return;
	const xpGain = (USER_XP_GAIN_PER_BATTLE - 2) * multiplier;
	let currentExp = user.exp + xpGain;
	if (currentExp >= user.r_exp) {
		currentExp = currentExp - user.r_exp;
		user.level = user.level + 1;
		user.r_exp = user.level * 47;
	}
	user.exp = currentExp;
	return {
		level: user.level,
		exp: user.exp,
		r_exp: user.r_exp,
		xpGain,
	};
};

type T = {
  isVictory: boolean;
  level: number;
  currentExp: number;
  r_exp: number;
  multiplier: number;
  battlingFloor: number;
  maxFloor: number;
};
const calculateUserDzReward = ({
	isVictory,
	level,
	currentExp,
	r_exp,
	multiplier,
	battlingFloor,
	maxFloor,
}: T) => {
	const rewardObject = {
		fragments: 3,
		exp: 13,
		gold: 100,
		level: 0,
		expGain: 0,
	};
	if (isVictory) {
		let expGain = 22 - (level - 1);
		if (expGain < 7) {
			expGain = 7;
		}
		rewardObject.exp = rewardObject.exp + randomNumber(expGain - 5, expGain);
		rewardObject.fragments = rewardObject.fragments + 4;
		let goldReward = randomNumber(80, 200);
		if (battlingFloor >= 50 && battlingFloor < 100) {
			goldReward = randomNumber(200, 400);
		} else if (battlingFloor >= 100 && battlingFloor < 150) {
			goldReward = randomNumber(400, 600);
		} else if (battlingFloor >= 150 && battlingFloor < 250) {
			goldReward = randomNumber(600, 700);
		} else if (battlingFloor >= 250) {
			goldReward = randomNumber(700, 800);
		}
		rewardObject.gold = rewardObject.gold + goldReward;
		if (level >= 100) {
			rewardObject.exp = rewardObject.exp - 1;
		} else if (level >= 200) {
			rewardObject.exp = rewardObject.exp - 2;
		} else if (level >= 300) {
			rewardObject.exp = rewardObject.exp - 3;
		}
		if (battlingFloor >= maxFloor) {
			rewardObject.fragments = rewardObject.fragments + 3;
			rewardObject.exp = rewardObject.exp + 12;
		}
	}
	rewardObject.fragments = rewardObject.fragments * multiplier;
	rewardObject.exp = rewardObject.exp * multiplier;
	rewardObject.gold = rewardObject.gold * multiplier;
	rewardObject.expGain = rewardObject.exp;
	let totalExp = currentExp + rewardObject.exp;
	if (totalExp >= r_exp) {
		rewardObject.level = 1;
		totalExp = totalExp - r_exp;
	}
	rewardObject.exp = totalExp;

	return rewardObject;
};
