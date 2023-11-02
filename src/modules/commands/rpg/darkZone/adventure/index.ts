import { DzFuncProps } from "@customTypes/darkZone";
import { DarkZoneProfileProps } from "@customTypes/darkZone/profile";
import { RawUpdateProps } from "@customTypes/utility";
import { updateRawDzProfile } from "api/controllers/DarkZoneController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { getRaidLobby } from "api/models/Raids";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { numericWithComma, randomNumber } from "helpers";
import { CACHE_KEYS } from "helpers/constants/cacheConstants";
import { DEFAULT_ERROR_TITLE, DOT } from "helpers/constants/constants";
import { DZ_INVENTORY_SLOTS_PER_LEVEL, PERMIT_PER_ADVENTURE } from "helpers/constants/darkZone";
import loggers from "loggers";
import { getCooldown, sendCommandCDResponse, setCooldown } from "modules/cooldowns";

export const sendOnAdventure = async ({
	context, client, options, args, dzUser 
}: DzFuncProps) => {
	try {
		const { author } = options;
		const key = CACHE_KEYS.ADVENTURE + author.id;
		const embed = createEmbed(author, client);
		const isComplete = args.includes("complete");
		const [ cacheData, user ] = await Promise.all([
			Cache.get(key),
			getRPGUser({ user_tag: author.id })
		]);
		if (!user) return;
		if (cacheData) {
			const res: { timestamp: number; } = JSON.parse(cacheData);
			const HOUR = 1000 * 60 * 60;
			const anHourAgo = new Date().getTime() - HOUR;
			if (res.timestamp > anHourAgo) {
				const remainingTime = res.timestamp - anHourAgo;
				let minutes = Math.floor(remainingTime / 1000 / 60);
				let seconds = Math.ceil((remainingTime / 1000) % 60);
				if (seconds < 0) seconds = 0;
				if (minutes < 0) minutes = 0;
				embed.setTitle(`Adventure Inprogress ${emoji.calm}`)
					.setDescription(
						"Your team is currently on an adventure. Come back after " +
                        `**${minutes}m ${seconds}s** to claim your loot. To claim your adventure loot ` +
                        "type `iz dz adv complete`."
					);

				context.channel?.sendMessage(embed);
				return;
			}
			if (isComplete) {
				await Cache.del(key);
				const dzReward = {
					fragments: {
						op: "+",
						value: randomNumber(50, 80)
					},
					exp: {
						op: "+",
						value: randomNumber(100, 200)
					},
				} as RawUpdateProps<Partial<DarkZoneProfileProps>>;
				const goldReward = randomNumber(6000, 8000);
				user.gold = user.gold + goldReward;
                
				let rewardDesc = `${DOT} ${dzReward.fragments?.value || 0} ${emoji.fragments} Fragments\n` +
                `${DOT} ${dzReward.exp?.value || 0} Exp :card_index:` +
                `\n${DOT} ${numericWithComma(goldReward)} Gold ${emoji.gold}`;
				const totalExp = dzUser.exp + (dzReward.exp?.value || 0);
				if (totalExp >= dzUser.r_exp) {
					dzReward.exp = {
						op: "=",
						value: totalExp - dzUser.r_exp
					};
					dzReward.level = {
						op: "+",
						value: 1
					};

					rewardDesc = rewardDesc + `\n${DOT} +${DZ_INVENTORY_SLOTS_PER_LEVEL} Inventory Max Slots\n` +
                    `${DOT} +1 Level up`;
				}
				await Promise.all([
					updateRawDzProfile({ user_tag: author.id }, dzReward),
					updateRPGUser({ user_tag: author.id }, { gold: user.gold })
				]);
				embed.setTitle(`Adventure Completed ${emoji.dance}`)
					.setDescription(
						`Congratulations summoner **${author.username}**, You have ` +
                        `completed the adventure and received\n\n**__Rewards__**\n${rewardDesc}`
					);

				context.channel?.sendMessage(embed);
				return;
			}
			embed.setTitle(`Adventure Completed ${emoji.dance}`)
				.setDescription("Your team has completed their adventure and are eager to come home. " +
                "To claim your loot type `iz dz adv complete`.");

			context.channel?.sendMessage(embed);
			return;
		}
		if (isComplete) {
			embed.setTitle(`Adventure Failed ${emoji.cry}`)
				.setDescription("Your team was abandoned and has failed to complete the adventure. " +
                "You will receive no rewards.\n\nTo start a new Adventure type `iz dz adv`.");
			context.channel?.sendMessage(embed);
			return;
		}
		const commandCd = await getCooldown(author.id, CACHE_KEYS.ADVENTURE);
		if (commandCd) {
			sendCommandCDResponse(context.channel, commandCd, author.id, CACHE_KEYS.ADVENTURE);
			return;
		}
		const raid = await getRaidLobby({ user_id: user.id });
		if ((raid || []).length > 0) {
			embed.setTitle(DEFAULT_ERROR_TITLE)
				.setDescription(`Summoner **${author.username}**, You are already ` + 
                "in a raid. Complete or leave your raid to start an adventure.");
			context.channel?.sendMessage(embed);
			return;
		}
		if (user.raid_pass < PERMIT_PER_ADVENTURE) {
			embed.setTitle(DEFAULT_ERROR_TITLE)
				.setDescription("You do not have sufficient Raid Permits to go on an Adventure. [0 / 1]");
			context.channel?.sendMessage(embed);
			return;
		}
		user.raid_pass = user.raid_pass - PERMIT_PER_ADVENTURE;
		await Promise.all([
			Cache.set(key, JSON.stringify({ timestamp: new Date().getTime() })),
			updateRPGUser({ user_tag: author.id }, { raid_pass: user.raid_pass }),
			setCooldown(author.id, CACHE_KEYS.ADVENTURE, 60 * 60 * 2),
			Cache.expire(key, 60 * 60 * 24)
		]);
		embed.setTitle(`Idle Adventure ${emoji.crossedswords}`)
			.setDescription(
				"You have successfully sent your team on an Adventure. Come back after 1 hour to claim " +
                "your loot. To claim your loot type `iz dz adv complete`."
			);

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("adventure.sendOnAdventure: ERROR", err);
		return;
	}
};