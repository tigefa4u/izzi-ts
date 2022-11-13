import {
	ConfirmationInteractionOptions,
	ConfirmationInteractionParams,
} from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import emoji from "emojis/emoji";
import { createConfirmationEmbed } from "helpers/confirmationEmbed";
import {
	BASE_ORBS_COUNT,
	DEFAULT_ERROR_TITLE,
	DEFAULT_SUCCESS_TITLE,
} from "helpers/constants";
import loggers from "loggers";
import { clearCooldown, getCooldown, setCooldown } from "modules/cooldowns";
import { confirmationInteraction } from "utility/ButtonInteractions";

async function validateAndProcessOrbs(
	params: ConfirmationInteractionParams<{ totalOrbsConsumable: number }>,
	options?: ConfirmationInteractionOptions
) {
	const totalOrbsConsumable = params.extras?.totalOrbsConsumable;
	if (!totalOrbsConsumable) return;
	const user = await getRPGUser({ user_tag: params.author.id });
	if (!user) return;
	const embed = createEmbed(params.author, params.client).setTitle(DEFAULT_ERROR_TITLE);

	if (user.orbs < totalOrbsConsumable) {
		embed.setDescription(
			"You do not have enough Blue Orbs to consume " +
        `**[${user.orbs}/${totalOrbsConsumable}]**\n${BASE_ORBS_COUNT} ` +
        `${emoji.blueorb} Blue Orbs = 1 ${emoji.shard} Shard`
		);
		params.channel?.sendMessage(embed);
		return;
	}
	const shardsToReceive = Math.floor(totalOrbsConsumable / BASE_ORBS_COUNT);
	if (options?.isConfirm) {
		user.shards = user.shards + shardsToReceive;
		user.orbs = user.orbs - totalOrbsConsumable;
		await updateRPGUser(
			{ user_tag: user.user_tag },
			{
				shards: user.shards,
				orbs: user.orbs,
			}
		);
		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(
				`Successfully consumed __${totalOrbsConsumable}__ ${emoji.blueorb} Blue Orbs and ` +
          `received __${shardsToReceive}__ ${emoji.shard} Shards.` +
          `\n**Current Shards:** __${user.shards}__\n**Current Blue Orbs:** __${user.orbs}__`
			);

		params.channel?.sendMessage(embed);
		return;
	}
	return {
		totalOrbsConsumable,
		shardsToReceive,
	};
}

export const consume = async ({
	context,
	client,
	args,
	options,
}: BaseProps) => {
	try {
		const author = options.author;
		const cooldownCommand = "consume-orbs";
		const _inProgress = await getCooldown(author.id, cooldownCommand);
		if (_inProgress) {
			context.channel?.sendMessage("You can use this command again after a minute.");
			return;
		}
		let multiplier = Number(args.shift());
		if (isNaN(multiplier) || !multiplier || multiplier < 1) multiplier = 1;
		const totalOrbsConsumable = Math.floor(multiplier) * BASE_ORBS_COUNT;
		const params = {
			client,
			channel: context.channel,
			author,
			extras: { totalOrbsConsumable },
		};
		let embed = createEmbed();
		let sentMessage: Message;
		const buttons = await confirmationInteraction(
			context.channel,
			author.id,
			params,
			validateAndProcessOrbs,
			(data, opts) => {
				if (data) {
					embed = createConfirmationEmbed(author, client).setDescription(
						`Orbs consumed: __${totalOrbsConsumable}__ ${emoji.blueorb}` +
              `\nShards received: __${data.shardsToReceive}__ ${emoji.shard}`
					);
				}
				if (opts?.isDelete) {
					clearCooldown(author.id, cooldownCommand);
					sentMessage.deleteMessage();
				}
			}
		);
		if (!buttons) return;

		embed.setHideConsoleButtons(true);
		embed.setButtons(buttons);
		setCooldown(author.id, cooldownCommand, 60);
		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.consumeOrbsToShards: ERROR",
			err
		);
		return;
	}
};
