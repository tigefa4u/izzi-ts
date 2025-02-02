import { BaseProps } from "@customTypes/command";
import { UserProps } from "@customTypes/users";
import {
	getDarkZoneProfile,
	updateRawDzProfile,
} from "api/controllers/DarkZoneController";
import {
	getRPGUser,
	levelUpUser,
	updateRPGUser,
} from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { randomElementFromArray, randomNumber } from "helpers";
import {
	DEFAULT_ERROR_TITLE,
	LOTTERY_PRICE,
	MAX_MANA_GAIN,
} from "helpers/constants/constants";
import loggers from "loggers";
import {
	getCooldown,
	sendCommandCDResponse,
	setCooldown,
} from "modules/cooldowns";

type T = {
  key: string;
  value: number;
};

export const lottery = async ({ context, client, options }: BaseProps) => {
	try {
		const author = options.author;
		const cd = await getCooldown(author.id, "lottery");
		if (cd) {
			sendCommandCDResponse(context.channel, cd, author.id, "lottery");
			return;
		}
		const [ user, dzUser ] = await Promise.all([
			getRPGUser({ user_tag: author.id }),
			getDarkZoneProfile({ user_tag: author.id }),
		]);
		if (!user) return;
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);

		if (user.gold < LOTTERY_PRICE) {
			embed.setDescription("You do not have enough gold to play the Lottery!");
			context.channel?.sendMessage(embed);
			return;
		}
		user.gold = user.gold - LOTTERY_PRICE;
		const rewards: {
			key: string;
			value: number;
			isDarkZone?: boolean;
		}[] = [
			{
				key: "gold",
				value: randomNumber(750, 3000),
			},
			{
				key: "mana",
				value: randomNumber(5, 20),
			},
		];
		if (dzUser) {
			rewards.push(
				{
					key: "fragments",
					value: randomNumber(10, 18),
					isDarkZone: true,
				});
		}
		const randomReward = randomElementFromArray(rewards);
		if (!randomReward) return;
		if (user.mana > user.max_mana && randomReward.key === "mana") {
			context.channel?.sendMessage("You already have max mana you can hold");
			return;
		}
		if (!randomReward.isDarkZone) {
			Object.assign(user, {
				[randomReward.key]:
          (user[randomReward.key as keyof UserProps] as number) +
          randomReward.value,
			});
		}

		embed.setTitle(`Lottery! ${emoji.celebration}`);
		let desc =
      `You have spent __${LOTTERY_PRICE}__ gold ${emoji.gold} and won the lottery receiving\n\n` +
      `__${randomReward.value}__ **${randomReward.key.toUpperCase()}**`;
		if (user.exp >= user.r_exp && randomReward.key === "exp") {
			const updatedUser = await levelUpUser(user);
			desc =
        desc +
        `\nYou have leveled up! You are now level __${updatedUser.level}__. ` +
        `${
        	user.max_mana >= MAX_MANA_GAIN
        		? "You have already gained the maximum obtainable mana"
        		: `We have also refilled your mana __${user.max_mana}__ -> __${
        			user.max_mana + 2
        		}__`
        }`;
		}
		const updateObj = { gold: user.gold };
		if (randomReward.key === "exp") {
			Object.assign(updateObj, { exp: user.exp });
		}
		if (randomReward.key === "mana" || randomReward.key === "gold") {
			Object.assign(updateObj, { [randomReward.key]: user[randomReward.key] });
		}

		const promises: any[] = [
			updateRPGUser({ user_tag: user.user_tag }, updateObj),
			setCooldown(author.id, "lottery", 900),
		];

		if (randomReward.isDarkZone) {
			promises.push(updateRawDzProfile({ user_tag: user.user_tag }, {
				fragments: {
					op: "+",
					value: randomReward.value
				} 
			}));
		}
		await Promise.all(promises);
		embed.setDescription(desc);
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.misc.lottery: ERROR", err);
		return;
	}
};
