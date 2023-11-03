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
		const manaToConsume = multiplier * MANA_PER_BATTLE;
		const reward = calculateUserReward({
			isVictory,
			level: clonedDzUser.level,
			currentExp: clonedDzUser.exp,
			r_exp: clonedDzUser.r_exp,
			battlingFloor,
			maxFloor: clonedDzUser.max_floor,
			multiplier,
		});
		const showBonus = battlingFloor >= clonedDzUser.max_floor && isVictory;
		let rewardDesc =
      `${DOT} __${numericWithComma(reward.gold)}__ Gold ${emoji.gold}\n` +
      `${DOT} ${reward.fragments} Fragments ${emoji.fragments}${
      	showBonus ? ` (+${multiplier * 3} Fragments Bonus)` : ""
      }\n` +
      `${DOT} __${numericWithComma(reward.expGain)}__ Exp${
      	showBonus ? ` (+${multiplier * 12} Exp Bonus)` : ""
      }`;

		let clonedUser: UserProps | undefined;
		if (user) {
			clonedUser = clone(user);
		} else {
			clonedUser = await getRPGUser({ user_tag: author.id }, { forceFetchFromDB: true });
		}
		if (!clonedUser) return;
		if (clonedUser.mana < manaToConsume) {
			channel?.sendMessage("You did not have sufficient mana to process your battle :x:");
			return;
		}

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
		if (reward.level > 0) {
			params.level = {
				op: "+",
				value: reward.level,
			};
			rewardDesc =
        rewardDesc +
        `\n${DOT} +${DZ_INVENTORY_SLOTS_PER_LEVEL} Inventory Max Slots` +
        `\n${DOT} +1 Level up\n${DOT} We have also refilled __${clonedUser.max_mana}__ Mana`;
		}
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
		if (reward.level > 0) {
			updateObj.level = {
				op: "+",
				value: 1,
			};
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
								args: [ "all" ],
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

type T = {
  isVictory: boolean;
  level: number;
  currentExp: number;
  r_exp: number;
  multiplier: number;
  battlingFloor: number;
  maxFloor: number;
};
const calculateUserReward = ({
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
		let expGain = 30 - (level - 1);
		if (expGain < 7) {
			expGain = 7;
		}
		rewardObject.exp = rewardObject.exp + randomNumber(expGain - 5, expGain);
		rewardObject.fragments = rewardObject.fragments + 4;
		let goldReward = randomNumber(80, 200);
		if (battlingFloor >= 60 && battlingFloor < 100) {
			goldReward = randomNumber(200, 400);
		} else if (battlingFloor >= 100 && battlingFloor < 140) {
			goldReward = randomNumber(400, 600);
		} else if (battlingFloor >= 140 && battlingFloor < 200) {
			goldReward = randomNumber(600, 700);
		} else if (battlingFloor >= 200) {
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
	const totalExp = currentExp + rewardObject.exp;
	if (totalExp >= r_exp) {
		rewardObject.level = 1;
		rewardObject.exp = totalExp - r_exp;
	} else {
		rewardObject.exp = totalExp;
	}

	return rewardObject;
};
