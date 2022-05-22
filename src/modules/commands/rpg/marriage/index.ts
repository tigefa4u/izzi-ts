import {
	AuthorProps,
	ChannelProp,
	ConfirmationInteractionOptions,
	ConfirmationInteractionParams,
} from "@customTypes";
import { BaseProps } from "@customTypes/command";
import {
	createMarriage,
	delMarriage,
	getMarriage,
} from "api/controllers/MarriagesController";
import {
	getRPGUser,
	getUser,
	updateRPGUser,
} from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import emoji from "emojis/emoji";
import { getIdFromMentionedString } from "helpers";
import { createConfirmationEmbed } from "helpers/confirmationEmbed";
import { MARRIAGE_BONUS } from "helpers/constants";
import loggers from "loggers";
import { clearCooldown, getCooldown, setCooldown } from "modules/cooldowns";
import { confirmationInteraction } from "utility/ButtonInteractions";

export const divorce = async ({ context, options }: BaseProps) => {
	try {
		const author = options.author;
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
		if (user.is_married === false) {
			context.reply({ content: "You are not married yet!" });
			return;
		}
		const marriage = await getMarriage({ user_tag: user.user_tag });
		if (!marriage) {
			await updateRPGUser({ user_tag: user.user_tag }, { is_married: false });
			return;
		}
		const ttl = 60 * 60 * 23;
		const promises = [
			updateRPGUser({ user_tag: user.user_tag }, { is_married: false }),
			updateRPGUser({ user_tag: marriage.married_to }, { is_married: false }),
			delMarriage({ user_tag: user.user_tag }),
			setCooldown(user.user_tag, "marriage", ttl),
			setCooldown(marriage.married_to, "marriage", ttl),
		];

		await Promise.all(promises);
		context.reply({ content: "You are now single!" });
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.marriage.divorce(): something went wrong",
			err
		);
		return;
	}
};

function validateCD(timestamp: string, id: string, channel: ChannelProp) {
	const remainingTime =
    (new Date(timestamp).valueOf() - new Date().valueOf()) / 1000 / 60;
	if (remainingTime < 0 || isNaN(remainingTime)) {
		clearCooldown(id, "marriage");
	}
	const remainingHours = Math.floor(remainingTime / 60);
	const remainingMinutes = Math.floor(remainingTime % 60);
	channel?.sendMessage(
		`You need to wait ${remainingHours} hours ${remainingMinutes} minutes, before you can propose again!`
	);
	return;
}

async function validateAndProcessMarriage(
	params: ConfirmationInteractionParams<{
    context: BaseProps["context"];
    mentionId?: string;
  }>,
	options?: ConfirmationInteractionOptions
) {
	const context = params.extras?.context;
	const mentionId = params.extras?.mentionId;
	if (!context || !mentionId) return;
	const mentionedUser = await getUser({
		user_tag: mentionId,
		is_banned: false,
	});
	if (!mentionedUser) return;
	if (mentionedUser.is_married) {
		context.reply({ content: `**${mentionedUser.username}** is already married!`, });
		return;
	}
	const cd = await getCooldown(params.author.id, "marriage");
	if (cd) {
		validateCD(cd.timestamp, params.author.id, params.channel);
		return;
	}
	const user = await getRPGUser({ user_tag: params.author.id });
	if (!user) return;
	if (user.is_married) {
		params.channel?.sendMessage("You are already married");
		return;
	}
	const cd_2 = await getCooldown(mentionedUser.user_tag, "marriage");
	if (cd_2) {
		validateCD(cd_2.timestamp, mentionedUser.user_tag, params.channel);
		return;
	}
	if (options?.isConfirm) {
		user.gold = user.gold + MARRIAGE_BONUS;
		mentionedUser.gold = mentionedUser.gold + MARRIAGE_BONUS;
		user.is_married = true;
		mentionedUser.is_married = true;
		const marriageArr = [
			{
				user_tag: user.user_tag,
				married_to: mentionedUser.user_tag,
			},
			{
				user_tag: mentionedUser.user_tag,
				married_to: user.user_tag,
			},
		];
		await Promise.all([
			updateRPGUser(
				{ user_tag: user.user_tag },
				{
					gold: user.gold,
					is_married: user.is_married,
				}
			),
			updateRPGUser(
				{ user_tag: mentionedUser.user_tag },
				{
					gold: mentionedUser.gold,
					is_married: mentionedUser.is_married,
				}
			),
			createMarriage(marriageArr),
		]);
		context.channel?.sendMessage(
			`Yay! ${emoji.celebration}, You are now married to ${mentionedUser.username}` +
        `\nYou both have received __${MARRIAGE_BONUS}__ ${emoji.gold}`
		);
	}
	return mentionedUser;
}

export const propose = async ({
	context,
	client,
	options,
	args,
}: BaseProps) => {
	try {
		const author = options.author;
		const cooldownCommand = "propose";
		const _inProgress = await getCooldown(author.id, cooldownCommand);
		if (_inProgress) {
			context.channel?.sendMessage("You can use this command again after a minute.");
			return;
		}
		const id = getIdFromMentionedString(args.shift() || "");
		if (!id) return;
		if (author.id === id) return;
		const params = {
			author,
			client,
			channel: context.channel,
			extras: {
				context,
				mentionId: id,
			},
		};
		let embed = createEmbed();
		let sentMessage: Message;
		const buttons = await confirmationInteraction(
			context.channel,
			id,
			params,
			validateAndProcessMarriage,
			(data, opts) => {
				if (data) {
					embed = createConfirmationEmbed(author, client).setDescription(
						`${author.username} has proposed **${data.username}** to marry them ❤️`
					);
				}
				if (opts?.isDelete) {
					clearCooldown(author.id, cooldownCommand);
					sentMessage.deleteMessage();
				}
			}
		);
		if (!buttons) return;

		embed.setButtons(buttons);
		setCooldown(author.id, cooldownCommand);
		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.marriage.propose(): something went wrong",
			err
		);
		return;
	}
};
