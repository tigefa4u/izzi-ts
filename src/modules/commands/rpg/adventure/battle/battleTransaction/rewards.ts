import { BattleTransactionProps } from "@customTypes/battle";
import { CollectionCreateProps } from "@customTypes/collections";
import { UserProps, UserUpdateProps } from "@customTypes/users";
import emoji from "emojis/emoji";
import { randomNumber } from "helpers";
import {
	CONSOLE_BUTTONS,
	LOW_LEVEL_THRESHOLD,
	MAX_MANA_GAIN,
	STARTER_CARD_EXP,
	STARTER_CARD_LEVEL,
	STARTER_CARD_R_EXP,
} from "helpers/constants";
import { ranksMeta } from "helpers/rankConstants";
import loggers from "loggers";
import { clone } from "utility";

type C = BattleTransactionProps["card"];
type A = BattleTransactionProps["author"];
export const calculateUserProgress = (
	user: UserProps,
	card: C,
	author: A,
	{ xpGain }: { xpGain: number }
) => {
	try {
		const clonedUser = clone(user);
		let desc, levelUpDesc;
		const upgradeObject = {} as UserUpdateProps;
		const rawUpdateObject = {} as UserUpdateProps;
		const menu = [];
		let extraGold = 0;
		if (card.floor == card.max_floor && card.ruin == card.max_ruin) {
			if (card.floor == card.max_ruin_floor && card.ruin == card.max_ruin) {
				desc =
          `Congratulations Summoner **${author.username}**! ${emoji.celebration} ` +
          "you have cleared this zone. " +
          `You can now proceed to **\`\`Zone ${
          	card.max_ruin + 1
          }.\`\`** You have received __750__g ${emoji.gold}`;
				rawUpdateObject.max_ruin = card.max_ruin + 1;
				rawUpdateObject.max_ruin_floor = 1;
				extraGold = 750;
				// await createOrUpdateZoneBackup({
				//     user_tag: user.user_tag,
				//     max_ruin: user.max_ruin,
				//     max_floor: 1,
				// });
				menu.push({
					label: CONSOLE_BUTTONS.NEXT_ZONE.label,
					params: { id: CONSOLE_BUTTONS.NEXT_ZONE.id },
				});
				rawUpdateObject.reached_max_ruin_at = new Date();
			} else {
				desc =
          `Congratulations Summoner **${author.username}**! ${emoji.celebration} ` +
          "you have cleared this floor and " +
          `can move on to the next one.\nYou have received __500__g ${emoji.gold}`;
				rawUpdateObject.max_ruin_floor = card.max_floor + 1;
				if (clonedUser.ruin == card.ruin) {
					rawUpdateObject.max_floor = rawUpdateObject.max_ruin_floor;
				}
				menu.push({
					label: CONSOLE_BUTTONS.NEXT_FLOOR.label,
					params: { id: CONSOLE_BUTTONS.NEXT_FLOOR.id },
				});
				extraGold = 500;
				// await createOrUpdateZoneBackup({
				//     max_ruin: user.ruin,
				//     max_floor: user.max_ruin_floor,
				//     user_tag: user.user_tag,
				// });
			}
		}
		const requiredExp = clonedUser.r_exp;
		let currentExp = clonedUser.exp;
		let levelUp = false;
		currentExp = currentExp + xpGain;
		if (currentExp >= requiredExp) {
			levelUp = true;
			upgradeObject.level = 1;

			// raw updates
			rawUpdateObject.exp = Math.abs(currentExp - requiredExp);
			rawUpdateObject.r_exp = (clonedUser.level + 1) * 47;

			extraGold = extraGold + (clonedUser.is_married ? 2000 : 750);
			levelUpDesc =
        `Yay **${author.username}**! you've leveled up ${
        	emoji.welldone
        }. you are now level ${clonedUser.level + 1}\nExp: [${
        	rawUpdateObject.exp
        } / ${rawUpdateObject.r_exp}]\nYou have received __${
        	clonedUser.is_married ? 2000 : 750
        }__ ${emoji.gold} (Hint: You receive __2000__ ${
        	emoji.gold
        } if married).` +
        `\nWe've restored your mana. ${
        	clonedUser.max_mana < MAX_MANA_GAIN
        		? `Your Mana is now __${clonedUser.max_mana}__ -> __${
        			clonedUser.max_mana + 2
        		}__.`
        		: "You have already gained the maximum obtainable mana"
        }`;
			if (clonedUser.max_mana < MAX_MANA_GAIN) {
				rawUpdateObject.max_mana = clonedUser.max_mana + 2;
			} else {
				rawUpdateObject.max_mana = clonedUser.max_mana;
			}
		} else {
			rawUpdateObject.exp = currentExp;
		}
		return {
			upgradeObject,
			menu,
			extraGold,
			desc,
			levelUpDesc,
			levelUp,
			rawUpdateObject,
		};
	} catch (err) {
		loggers.error("battleTransaction.rewards.calculateUserProps: ERROR", err);
		return;
	}
};

export const calculateUserRewards = (user: UserProps, multiple = 1) => {
	try {
		const rankReward = "platinum";
		const rankId = ranksMeta.platinum.rank_id;
		let goldReward = randomNumber(80, 109);
		if (user.max_ruin >= 20 && user.max_ruin < 40) {
			goldReward = randomNumber(110, 150);
			// rankReward = "gold";
			// rankId = 2;
		} else if (user.max_ruin >= 40 && user.max_ruin < 100) {
			goldReward = randomNumber(160, 200);
			// rankReward = "platinum";
			// rankId = 3;
		} else if (user.max_ruin >= 100) {
			goldReward = randomNumber(210, 500);
			// rankReward = "platinum";
			// rankId = 3;
		}
		// helps boost new players
		if (user.level <= LOW_LEVEL_THRESHOLD) {
			goldReward = goldReward + 100;
		}
		return {
			rankReward,
			rankId,
			goldReward: goldReward * multiple,
		};
	} catch (err) {
		loggers.error("battleTransaction.calculateUserRewards: ERROR", err);
		return;
	}
};

type FF = {
  character_id: number;
  user_id: number;
  rankReward: string;
  rankId: number;
  multiplier: number;
};
export const prepareFloorFodder = ({
	character_id,
	user_id,
	rankReward,
	rankId,
	multiplier = 1,
}: FF) => {
	try {
		const options = {
			character_id,
			character_level: STARTER_CARD_LEVEL,
			user_id,
			rank: rankReward,
			rank_id: rankId,
			is_item: false,
			is_on_market: false,
			exp: STARTER_CARD_EXP,
			r_exp: STARTER_CARD_R_EXP,
			is_on_cooldown: false,
			is_tradable: true,
		};
		loggers.info(
			`prepareFloorFodder: returning ${multiplier}x cards ->`,
			options
		);
		const bodyParams: CollectionCreateProps[] = Array(multiplier)
			.fill(options)
			.map((item) => item);

		return bodyParams;
	} catch (err) {
		loggers.error("battleTransaction.rewards.prepareFloorFodder: ERROR", err);
		return;
	}
};
