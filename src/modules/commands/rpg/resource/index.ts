import { BaseProps } from "@customTypes/command";
import { getRPGUser, getUser, updateRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { getIdFromMentionedString, randomElementFromArray } from "helpers";
import { DEFAULT_ERROR_TITLE, GOLD_LIMIT, HOURLY_MANA_REGEN } from "helpers/constants";
import loggers from "loggers";
import { getCooldown, sendCommandCDResponse, setCooldown } from "modules/cooldowns";

export const hourly = async ({ context, options }: BaseProps) => {
	try {
		const author = options.author;
		const cooldown = await getCooldown(author.id, "hourly");
		if (cooldown) {
			sendCommandCDResponse(context.channel, cooldown, author.id, "hourly");
			return;
		}
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
		const randomManaRegen = randomElementFromArray<number>(HOURLY_MANA_REGEN);
		if (!randomManaRegen) return;
		user.mana = user.mana + randomManaRegen;
		await updateRPGUser({ user_tag: author.id }, { mana: user.mana });
		const hourInSec = 60 * 60;
		await setCooldown(author.id, "hourly", hourInSec);
		context.channel?.sendMessage(`Congratulations ${emoji.celebration}!` + " " +
            `You have received __${randomManaRegen}__ Mana for your hourly bonus`);
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.resource.hourly(): something went wrong", err);
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
		if (isNaN(transferAmount) || transferAmount > GOLD_LIMIT) {
			embed.setDescription("Invalid Amount. You can transfer up to __" + GOLD_LIMIT + "__ Gold " + emoji.gold);
			context.channel?.sendMessage(embed);
			return;
		} 
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
		if (user.gold < transferAmount) {
			embed.setDescription("You have insufficient gold");
			context.channel?.sendMessage(embed);
			return;
		}
		const mentionedUser = await getUser({
			user_tag: mentionedId,
			is_banned: false 
		});
		if (!mentionedUser) return;
		if (user.id === mentionedUser.id) return;
		user.gold = user.gold - transferAmount;
		mentionedUser.gold = mentionedUser.gold + transferAmount;
		await updateRPGUser({ user_tag: user.user_tag }, { gold: user.gold });
		await updateRPGUser({ user_tag: mentionedUser.user_tag }, { gold: mentionedUser.gold });
		context.channel?.sendMessage(
			`Successfully transfered __${transferAmount}__ Gold ${emoji.gold} to **${mentionedUser.username}**`);
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.resource.give(): something went wrong", err);
		return;
	}
};