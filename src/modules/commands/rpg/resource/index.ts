import { ChannelProp } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import {
	getRPGUser,
	getUser,
	updateRPGUser,
} from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { taskQueue } from "handlers/taskQueue/gcp";
import {
	getIdFromMentionedString,
	numericWithComma,
	randomElementFromArray,
} from "helpers";
import { OS_LOG_CHANNELS } from "helpers/constants/channelConstants";
import {
	DEFAULT_ERROR_TITLE,
	DEFAULT_SUCCESS_TITLE,
	GOLD_LIMIT,
	HOURLY_MANA_REGEN,
	REQUIRED_TRADE_LEVEL,
} from "helpers/constants/constants";
import loggers from "loggers";
import {
	getCooldown,
	sendCommandCDResponse,
	setCooldown,
} from "modules/cooldowns";
import { DATE_OPTIONS } from "utility";

export const hourly = async ({ context, options, client }: BaseProps) => {
	try {
		const author = options.author;
		const cooldown = await getCooldown(author.id, "hourly");
		if (cooldown) {
			sendCommandCDResponse(context.channel, cooldown, author.id, "hourly");
			return;
		}
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
		if (user.mana > user.max_mana) {
			context.channel?.sendMessage("You already have max mana you can hold");
			return;
		}
		const randomManaRegen = randomElementFromArray<number>(HOURLY_MANA_REGEN);
		if (!randomManaRegen) return;
		user.mana = user.mana + randomManaRegen;
		const hourInSec = 60 * 60;
		await Promise.all([
			updateRPGUser({ user_tag: author.id }, { mana: user.mana }),
			setCooldown(author.id, "hourly", hourInSec),
		]);
		const embed = createEmbed(author, client)
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(
				`Congratulations Summoner **${author.username}** ${emoji.celebration}! ` +
          `You have received __${randomManaRegen}__ Mana for your hourly bonus`
			);
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.resource.hourly: ERROR", err);
		return;
	}
};

export const give = async ({ context, client, options, args }: BaseProps) => {
	try {
		const mentionedId = getIdFromMentionedString(args[0]);
		if (!mentionedId) return;
		const author = options.author;
		const transferAmount = parseInt(args[1]);
		const embed = createEmbed()
			.setTitle(DEFAULT_ERROR_TITLE)
			.setThumbnail(client.user?.displayAvatarURL() || "");
		if (isNaN(transferAmount) || transferAmount > GOLD_LIMIT || transferAmount < 0) {
			embed.setDescription(
				"Invalid Amount. Please enter a valid amount between __1__ and __" +
          numericWithComma(GOLD_LIMIT) +
          "__ Gold " +
          emoji.gold
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
		if (user.level < REQUIRED_TRADE_LEVEL) {
			embed.setDescription(
				`Summoner **${author.username}**, ` +
          `You must be atleast __level ${REQUIRED_TRADE_LEVEL}__ to be able to transfer/receive gold.`
			);
			context.channel?.sendMessage(embed);
			return;
		}
		if (user.gold < transferAmount) {
			embed.setDescription("You have insufficient gold");
			context.channel?.sendMessage(embed);
			return;
		}
		const mentionedUser = await getUser({
			user_tag: mentionedId,
			is_banned: false,
		});
		if (!mentionedUser) return;
		if (mentionedUser.level < REQUIRED_TRADE_LEVEL) {
			embed.setDescription(
				`Summoner **${mentionedUser.username}**, ` +
          `must be atleast __level ${REQUIRED_TRADE_LEVEL}__ to be able to transfer/receive gold.`
			);
			context.channel?.sendMessage(embed);
			return;
		}
		if (user.id === mentionedUser.id) return;
		user.gold = user.gold - transferAmount;
		mentionedUser.gold = mentionedUser.gold + transferAmount;
		await Promise.all([
			updateRPGUser({ user_tag: user.user_tag }, { gold: user.gold }),
			updateRPGUser(
				{ user_tag: mentionedUser.user_tag },
				{ gold: mentionedUser.gold }
			),
		]);
		context.channel?.sendMessage(
			`Successfully transfered __${numericWithComma(transferAmount)}__ Gold ${
				emoji.gold
			} to **${mentionedUser.username}**`
		);

		const msg = `Server: ${context.guild?.name || "Unknown"} (${
			context.guild?.id || "Unknown"
		}) ${author.username} (${author.id}) Transfered __${numericWithComma(transferAmount)}__ ` +
					`Gold ${emoji.gold} to ${mentionedUser.username} (${mentionedId}). ${new Date().toLocaleDateString(
						"en-us",
						DATE_OPTIONS
					)}`;
		taskQueue("log-give", {
			message: msg,
			channelId: OS_LOG_CHANNELS.GIVE
		});
		// const logChannel = (await client.channels.fetch(
		// 	OS_LOG_CHANNELS.GIVE
		// )) as ChannelProp | null;
		// if (logChannel) {
		// 	logChannel.sendMessage(
		// 		`Server: ${context.guild?.name || "Unknown"} (${
		// 			context.guild?.id || "Unknown"
		// 		}) ${author.username} (${author.id}) Transfered __${numericWithComma(transferAmount)}__ ` +
		// 		`Gold ${emoji.gold} to ${mentionedUser.username} (${mentionedId}). ${new Date().toLocaleDateString(
		// 			"en-us",
		// 			DATE_OPTIONS
		// 		)}`
		// 	);
		// }
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.resource.give: ERROR", err);
		return;
	}
};
